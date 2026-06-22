'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, ExternalLink, User, Layers } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TestingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const daySortOrder: { [key: string]: number } = {
  "الأحد": 1, "الاثنين": 2, "الثلاثاء": 3, "الأربعاء": 4, "الخميس": 5, "الجمعة": 6, "السبت": 7
};

export function TestingScheduleModal({ isOpen, onClose }: TestingScheduleModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [testingGroups, setTestingGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isOpen || !db || profile?.role !== 'admin') {
      if (!isOpen) setLoading(true);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "testing_groups"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestingGroups(data);
      setLoading(false);
    }, (error) => {
      console.error("Schedule Listener Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, profile]);

  const normalizeDay = (day: string) => {
    if (!day) return "";
    const d = day.trim();
    if (d === "أحد" || d === "الأحد") return "الأحد";
    if (d === "اثنين" || d === "الاثنين") return "الاثنين";
    if (d === "ثلاثاء" || d === "الثلاثاء") return "الثلاثاء";
    if (d === "أربعاء" || d === "الأربعاء") return "الأربعاء";
    if (d === "خميس" || d === "الخميس") return "الخميس";
    if (d === "جمعة" || d === "الجمعة") return "الجمعة";
    if (d === "سبت" || d === "السبت") return "السبت";
    return d;
  };

  const groupedSchedule = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    testingGroups.forEach(group => {
      if (group.status === 'completed') return;

      group.testers?.forEach((tester: any) => {
        tester.assignedDays?.forEach((dayRaw: string) => {
          const day = normalizeDay(dayRaw);
          if (!day) return;
          if (!grouped[day]) grouped[day] = [];
          
          let existingProject = grouped[day].find(p => p.projectId === (group.projectId || group.id));
          
          const testerInfo = {
            email: tester.email,
            phone: tester.phone
          };

          if (existingProject) {
            existingProject.testers.push(testerInfo);
          } else {
            grouped[day].push({
              projectId: group.projectId || group.id,
              projectName: group.projectName,
              resourceLink: group.resourceLink,
              notes: group.notes,
              testers: [testerInfo]
            });
          }
        });
      });
    });

    return Object.keys(grouped)
      .sort((a, b) => (daySortOrder[a] || 99) - (daySortOrder[b] || 99))
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as typeof grouped);
  }, [testingGroups]);

  const handleSendDayNotifications = (day: string, projects: any[]) => {
    if (projects.length === 0) return;

    let totalSent = 0;
    projects.forEach(project => {
      project.testers?.forEach((tester: any) => {
        if (!tester.phone) return;
        totalSent++;

        let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
        else if (!cleanPhone.startsWith('2')) cleanPhone = '20' + cleanPhone;

        const message = `*تنبيه مهمة اختبار ليوم ${day}* 🚀\n\n` +
          `المشروع: *${project.projectName}*\n` +
          `رابط النسخة: ${project.resourceLink || 'سيتم إرساله لاحقاً'}\n` +
          `${project.notes ? `تعليمات: ${project.notes}` : ''}\n\n` +
          `يرجى المتابعة والبدء في الاختبار. بالتوفيق.`;

        setTimeout(() => {
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }, totalSent * 1000);
      });
    });

    toast({ title: `إرسال تنبيهات ${day}`, description: `يتم الآن فتح ${totalSent} محادثات واتساب لفريق اليوم.` });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = Object.entries(groupedSchedule).map(([day, projects]) => `
      <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; background: #fff;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 4px;">${day}</h3>
        ${projects.map(p => `
          <div style="margin-top: 8px; border-right: 3px solid #3b82f6; padding-right: 10px;">
            <p style="font-size: 13px; margin: 4px 0; font-weight: 900;">مشروع: ${p.projectName}</p>
            <p style="font-size: 11px; margin: 2px 0; color: #64748b;">المختبرون: ${p.testers.map((t:any) => t.email).join('، ')}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head><title>جدول الاختبارات الأسبوعي</title><style>@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'); body { font-family: 'Cairo', sans-serif; padding: 30px; background: #f8fafc; color: #334155; }</style></head>
        <body>
          <h2 style="text-align: center; font-size: 22px; font-weight: 900; color: #1e293b; margin-bottom: 30px;">جدول مهام الاختبار الأسبوعية</h2>
          ${content || '<p style="text-align: center; color: #94a3b8; font-weight: bold; margin-top: 50px;">لا توجد مهام اختبار مجدولة حالياً</p>'}
          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px;">هذا التقرير صادر آلياً من نظام APP STORE</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-4 text-primary-foreground shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <CalendarDays className="h-5 w-5" />
              </div>
              <DialogTitle className="text-sm font-black">جدول الاختبارات الأسبوعي</DialogTitle>
            </div>
            <Button onClick={handlePrint} variant="outline" className="h-8 rounded-xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-[10px] gap-2 transition-all">
              <Printer className="h-4 w-4" /> طباعة الجدول
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">جاري جلب بيانات المختبرين...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-24 opacity-30">
              <CalendarDays className="h-16 w-16 mx-auto mb-3" />
              <p className="font-black text-sm uppercase">لا توجد مهام اختبار مسجلة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(groupedSchedule).map(([day, projects]) => (
                <div key={day} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between transition-colors group-hover:bg-primary">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <h3 className="font-black text-xs">{day}</h3>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, projects)}
                      className="h-8 rounded-xl bg-green-500 hover:bg-green-600 font-black text-[10px] gap-2 px-4 shadow-lg active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" /> إرسال تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-4 space-y-3">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 flex flex-col gap-3 hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                               <Layers className="h-4 w-4 text-primary" />
                               <p className="font-black text-slate-800 text-sm truncate">{proj.projectName}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{proj.testers.map((t:any)=>t.email.split('@')[0]).join('، ')}</p>
                              </div>
                              <Badge variant="outline" className="text-[9px] h-5 font-black px-2 bg-white">
                                {proj.testers.length} مختبرين
                              </Badge>
                            </div>
                          </div>
                          {proj.resourceLink && (
                            <a href={proj.resourceLink} target="_blank" className="h-9 w-9 rounded-xl bg-white border shadow-sm text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        {proj.notes && <p className="text-[10px] text-slate-500 font-bold border-r-2 border-slate-200 pr-3 leading-relaxed line-clamp-2">{proj.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
