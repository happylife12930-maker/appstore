
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CalendarDays, Printer, Mail, X, MessageCircle, Phone, Info, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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

// دالة لتنظيف وتوحيد نصوص الأيام لمنع مشاكل المطابقة
const normalizeDay = (day: string) => {
  if (!day) return "";
  return day.trim()
    .replace(/^ال/, "") // إزالة "ال" التعريف للتبسيط في المطابقة إذا لزم الأمر
    .replace(/أ/g, "ا")
    .replace(/إ/g, "ا")
    .replace(/آ/g, "ا");
};

const getOriginalDay = (input: string) => {
  const normInput = normalizeDay(input);
  return DAYS_OF_WEEK.find(d => normalizeDay(d) === normInput) || input;
};

export function TestingScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [schedule, setSchedule] = React.useState<Schedule>({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen || !db) return;

    setLoading(true);
    // جلب كافة مجموعات الاختبار النشطة والمنتهية لضمان عدم ضياع أي داتا
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const newSchedule: Schedule = {};

      // تهيئة الأيام
      DAYS_OF_WEEK.forEach(day => {
        newSchedule[day] = [];
      });

      // خوارزمية التوزيع المتقدمة
      groups.forEach((group) => {
        if (!group.testers || !Array.isArray(group.testers)) return;
        
        group.testers.forEach((tester) => {
          if (!tester.assignedDays || !Array.isArray(tester.assignedDays)) return;
          
          tester.assignedDays.forEach((rawDay: string) => {
            const day = getOriginalDay(rawDay);
            
            if (newSchedule[day]) {
              // التحقق من تكرار المشروع في نفس اليوم
              let projectEntry = newSchedule[day].find(p => 
                p.projectName === group.projectName || p.projectId === group.projectId
              );

              const testerInfo = { 
                email: tester.email || "بدون بريد", 
                phone: tester.phone || "" 
              };

              if (projectEntry) {
                // منع تكرار المختبر في نفس المشروع لنفس اليوم
                if (!projectEntry.testers.find(t => t.email === testerInfo.email)) {
                  projectEntry.testers.push(testerInfo);
                }
              } else {
                newSchedule[day].push({
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

  const handleSendWhatsApp = (project: ScheduleProject, day: string) => {
    const testersWithPhone = project.testers.filter((t) => !!t.phone);
    
    if (testersWithPhone.length === 0) {
      toast({ title: "تنبيه", description: "لا توجد أرقام هواتف مسجلة لهؤلاء المختبرين.", variant: "destructive" });
      return;
    }

    testersWithPhone.forEach((tester, index) => {
      let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
      else if (!cleanPhone.startsWith('2')) cleanPhone = '20' + cleanPhone;

      const message = `*تنبيه بمهمة اختبار - يوم ${day}* 🚀

مرحباً، نود تذكيركم بمهمة الاختبار المقررة لكم اليوم لمشروع: *${project.projectName}*

*رابط نسخة الاختبار / المرفقات:*
🔗 ${project.resourceLink || 'سيتم تزويدكم به لاحقاً'}

${project.notes ? `*تعليمات الإدارة:*
📝 ${project.notes}` : ''}

يرجى البدء في الاختبار وموافاتنا بالتقرير فور الانتهاء.
بالتوفيق، فريق APP STORE.`;

      const encodedMessage = encodeURIComponent(message);
      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
      }, index * 1000);
    });

    toast({ title: "جاري الإرسال", description: `يتم فتح ${testersWithPhone.length} نافذة واتساب الآن.` });
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = "";
    DAYS_OF_WEEK.forEach(day => {
      const projects = schedule[day];
      if (projects && projects.length > 0) {
        content += `
          <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <h2 style="background: #1e293b; color: white; padding: 10px 20px; border-radius: 10px; display: inline-block;">${day}</h2>
            ${projects.map(p => `
              <div style="border: 2px solid #eee; padding: 20px; border-radius: 15px; margin-top: 15px;">
                <div style="font-weight: 900; color: #2563eb; font-size: 18px;">${p.projectName}</div>
                <div style="margin-top: 10px; font-size: 14px;"><b>المختبرون:</b> ${p.testers.map(t => t.email).join('، ')}</div>
                ${p.notes ? `<div style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">📝 ${p.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
    });

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>جدول التوزيع الأسبوعي</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            h1 { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
          </style>
        </head>
        <body>
          <h1>جدول توزيع مهام الاختبار الأسبوعي - APP STORE</h1>
          ${content || '<p style="text-align:center;">لا توجد مهام مجدولة لهذا الأسبوع.</p>'}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white" dir="rtl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md">
                <CalendarDays className="h-10 w-10" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold text-lg">توزيع المهام اليومي لضمان الجودة</DialogDescription>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full hover:bg-white/10 text-white h-12 w-12">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-8 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Loader2 className="h-14 w-14 animate-spin text-primary" />
              <p className="font-black text-slate-500 text-xl">جاري تجميع بيانات الجدول...</p>
            </div>
          ) : (
            <div className="space-y-12 pb-10">
              {DAYS_OF_WEEK.map(day => {
                const projects = schedule[day];
                if (!projects || projects.length === 0) return null;
                return (
                  <div key={day} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-slate-800 bg-white px-8 py-3 rounded-2xl shadow-sm border-r-8 border-primary">
                        {day}
                      </h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col group">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">{proj.projectName}</h4>
                            <div className="p-2 bg-slate-50 rounded-xl">
                              <Info className="h-5 w-5 text-slate-300" />
                            </div>
                          </div>

                          <div className="space-y-4 mb-8 flex-1">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase pr-2">المختبرون اليوم</span>
                              <div className="grid grid-cols-1 gap-2">
                                {proj.testers.map(tester => (
                                  <div key={tester.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <Mail className="h-4 w-4 text-primary shrink-0" />
                                      <span className="text-xs font-bold text-slate-600 truncate">{tester.email}</span>
                                    </div>
                                    {tester.phone && (
                                      <Badge variant="outline" className="shrink-0 bg-green-50 text-green-600 border-green-100" dir="ltr">
                                        {tester.phone}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {proj.resourceLink && (
                              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                                <span className="text-[9px] font-black text-primary uppercase">رابط النسخة</span>
                                <a href={proj.resourceLink} target="_blank" className="text-[9px] font-black text-primary underline flex items-center gap-1">
                                  فتح <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}
                          </div>

                          <Button 
                            onClick={() => handleSendWhatsApp(proj, day)}
                            className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm gap-3 shadow-lg active:scale-95 transition-all"
                          >
                            <MessageCircle className="h-6 w-6" /> إرسال تنبيهات يوم {day}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(schedule).every(day => schedule[day].length === 0) && (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                  <CalendarDays className="h-32 w-32 text-slate-200" />
                  <h3 className="text-3xl font-black text-slate-400">الجدول فارغ حالياً</h3>
                  <p className="text-lg font-bold text-slate-400 max-w-md mx-auto leading-relaxed">تأكد من تعيين أيام الاختبار للمختبرين من صفحة "إدارة المختبرين" لتظهر هنا.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-10 bg-white border-t shrink-0 flex gap-4">
          <Button 
            onClick={handlePrint} 
            disabled={loading || Object.keys(schedule).every(day => schedule[day].length === 0)}
            className="flex-1 h-20 rounded-[1.5rem] font-black gap-4 text-2xl shadow-2xl bg-slate-900"
          >
            <Printer className="h-8 w-8" />
            طباعة جدول التوزيع
          </Button>
          <Button variant="outline" onClick={onClose} className="h-20 px-10 rounded-[1.5rem] font-black text-xl border-2">إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
