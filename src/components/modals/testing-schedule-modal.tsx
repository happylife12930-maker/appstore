'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CalendarDays, Printer, X, MessageCircle, Info, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ScheduleProject {
  projectId: string;
  projectName: string;
  resourceLink?: string;
  notes?: string;
  testers: {
    email: string;
    phone: string;
  }[];
}

interface Schedule {
  [day: string]: ScheduleProject[];
}

const DAYS_OF_WEEK = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// دالة لتطهير نص اليوم لضمان المطابقة
const normalizeDay = (day: string) => {
  if (!day) return "";
  let d = day.trim();
  if (d === "الأحد" || d === "أحد") return "الأحد";
  if (d === "الاثنين" || d === "اثنان" || d === "إثنين") return "الاثنين";
  if (d === "الثلاثاء" || d === "ثلاثاء") return "الثلاثاء";
  if (d === "الأربعاء" || d === "أربعاء") return "الأربعاء";
  if (d === "الخميس" || d === "خميس") return "الخميس";
  if (d === "الجمعة" || d === "جمعة") return "الجمعة";
  if (d === "السبت" || d === "سبت") return "الالسبت";
  return d;
};

export function TestingScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [schedule, setSchedule] = React.useState<Schedule>({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen || !db) return;

    setLoading(true);
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const newSchedule: Schedule = {};

      DAYS_OF_WEEK.forEach(day => {
        newSchedule[day] = [];
      });

      groups.forEach((group) => {
        if (!group.testers || !Array.isArray(group.testers)) return;
        
        group.testers.forEach((tester) => {
          if (!tester.assignedDays || !Array.isArray(tester.assignedDays)) return;
          
          tester.assignedDays.forEach((rawDay: string) => {
            const dayKey = normalizeDay(rawDay);
            
            if (dayKey && newSchedule[dayKey]) {
              let projectEntry = newSchedule[dayKey].find(p => 
                p.projectId === group.projectId || p.projectName === group.projectName
              );

              const testerInfo = { 
                email: tester.email || "بدون بريد", 
                phone: tester.phone || "" 
              };

              if (projectEntry) {
                if (!projectEntry.testers.find(t => t.email === testerInfo.email)) {
                  projectEntry.testers.push(testerInfo);
                }
              } else {
                newSchedule[dayKey].push({
                  projectId: group.projectId || group.id,
                  projectName: group.projectName || "مشروع غير مسمى",
                  resourceLink: group.resourceLink || "",
                  notes: group.notes || "",
                  testers: [testerInfo],
                });
              }
            }
          });
        });
      });
      
      setSchedule(newSchedule);
      setLoading(false);
    }, (error) => {
      console.error("Schedule Load Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen]);

  const handleSendDayNotifications = (day: string) => {
    const projects = schedule[day];
    let totalSent = 0;

    projects.forEach((project) => {
      const testersWithPhone = project.testers.filter((t) => !!t.phone);
      
      testersWithPhone.forEach((tester, index) => {
        let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
        else if (!cleanPhone.startsWith('2')) cleanPhone = '20' + cleanPhone;

        const message = `*تذكير بمهمة اختبار - يوم ${day}* 🚀\n\nنحيطكم علماً بمهمة الاختبار لليوم لمشروع: *${project.projectName}*\n\n🔗 رابط النسخة: ${project.resourceLink || 'سيزودكم به المدير'}\n\n${project.notes ? `📝 تعليمات: ${project.notes}` : ''}\n\nبالتوفيق، فريق APP STORE.`;
        const encodedMessage = encodeURIComponent(message);
        
        setTimeout(() => {
          window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
        }, totalSent * 800);
        
        totalSent++;
      });
    });

    if (totalSent > 0) {
      toast({ title: "جاري الإرسال", description: `يتم فتح محادثات واتساب لـ ${totalSent} مختبر في يوم ${day}.` });
    } else {
      toast({ title: "تنبيه", description: "لا يوجد مختبرين بأرقام هواتف مسجلة لهذا اليوم.", variant: "destructive" });
    }
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let content = "";
    DAYS_OF_WEEK.forEach(day => {
      const projects = schedule[day];
      if (projects && projects.length > 0) {
        content += `
          <div style="margin-bottom: 10px; page-break-inside: avoid; border: 1px solid #eee; padding: 10px; border-radius: 8px;">
            <h3 style="background: #1e293b; color: white; padding: 4px 10px; border-radius: 4px; display: inline-block; font-size: 11px; margin-bottom: 5px;">${day}</h3>
            ${projects.map(p => `
              <div style="margin-top: 5px; padding-bottom: 5px; border-bottom: 1px dashed #eee;">
                <div style="font-weight: 900; color: #1e293b; font-size: 11px;">${p.projectName}</div>
                <div style="font-size: 9px; color: #64748b;">المختبرون: ${p.testers.map(t => t.email).join('، ')}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
    });

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>جدول الاختبارات</title>
          <style>@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'); body { font-family: 'Cairo', sans-serif; padding: 15px; }</style>
        </head>
        <body>
          <h2 style="text-align:center; border-bottom: 2px solid #eee; padding-bottom: 8px; font-size: 14px;">توزيع مهام الاختبارات</h2>
          ${content || '<p style="text-align:center; color: #94a3b8; font-size: 11px;">لا توجد مهام حالياً.</p>'}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[80vh] flex flex-col rounded-2xl p-0 border-none shadow-2xl overflow-hidden bg-white" dir="rtl">
        <DialogHeader className="p-4 bg-primary text-primary-foreground shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black">جدول الاختبارات المدمج</DialogTitle>
              <DialogDescription className="text-[10px] text-primary-foreground/70 font-bold">إرسال تنبيهات يومية لكافة المختبرين بضغطة واحدة</DialogDescription>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full hover:bg-white/10 text-white h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-bold text-slate-400 text-xs">جاري تجميع بيانات الجدول الأسبوعي...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const projects = schedule[day];
                if (!projects || projects.length === 0) return null;
                return (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border-r-4 border-primary">
                      <h3 className="text-xs font-black text-slate-800 pr-2">
                        {day}
                      </h3>
                      <Button 
                        onClick={() => handleSendDayNotifications(day)}
                        size="sm"
                        className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-[10px] gap-2 px-4"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> إرسال تنبيهات {day} للجميع
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col gap-3 hover:border-primary/20 transition-all group">
                          <div className="flex justify-between items-start">
                             <h4 className="text-xs font-black text-slate-800 leading-tight flex-1">{proj.projectName}</h4>
                             <Info className="h-3.5 w-3.5 text-slate-300" />
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {proj.testers.map(tester => (
                              <Badge key={tester.email} variant="outline" className="text-[9px] font-bold bg-slate-50 border-slate-100 py-0.5 px-2 h-5 rounded-md text-slate-600">
                                {tester.email.split('@')[0]}
                              </Badge>
                            ))}
                          </div>

                          {proj.resourceLink && (
                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                              <a href={proj.resourceLink} target="_blank" className="text-[10px] font-black text-primary flex items-center gap-1.5 hover:underline bg-primary/5 px-3 py-1 rounded-lg">
                                <ExternalLink className="h-3 w-3" /> رابط النسخة
                              </a>
                              <span className="text-[9px] font-bold text-slate-400">({proj.testers.length}) مختبرين</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(schedule).every(day => schedule[day].length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CalendarDays className="h-10 w-10 text-slate-300" />
                  </div>
                  <p className="font-black text-sm text-slate-600">الجدول لا يحتوي على أي مهام حالياً</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">تأكد من تعيين مشاريع لمختبرين وتحديد أيام العمل لهم في "إدارة المختبرين".</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 bg-white border-t flex gap-3">
          <Button 
            onClick={handlePrint} 
            disabled={loading || Object.keys(schedule).every(day => schedule[day].length === 0)} 
            className="flex-1 h-11 rounded-xl font-black gap-2 text-xs bg-slate-900 shadow-lg"
          >
            <Printer className="h-4 w-4" /> طباعة الجدول الأسبوعي
          </Button>
          <Button variant="outline" onClick={onClose} className="h-11 px-8 rounded-xl font-black text-xs">إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
