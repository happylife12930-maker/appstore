
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CalendarDays, Printer, Mail, X, MessageCircle, Phone, Info, ExternalLink } from "lucide-react";
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

      // تهيئة الأيام بشكل صحيح
      DAYS_OF_WEEK.forEach(day => {
        newSchedule[day] = [];
      });

      // خوارزمية التوزيع الذكي للمختبرين والمشاريع
      groups.forEach((group) => {
        if (!group.testers || !Array.isArray(group.testers)) return;
        
        group.testers.forEach((tester) => {
          if (!tester.assignedDays || !Array.isArray(tester.assignedDays)) return;
          
          tester.assignedDays.forEach((day: string) => {
            const normalizedDay = day.trim();
            
            // التحقق من وجود اليوم في القائمة المعتمدة
            if (newSchedule[normalizedDay] !== undefined) {
              // البحث عما إذا كان المشروع مضافاً مسبقاً لهذا اليوم
              let projectEntry = newSchedule[normalizedDay].find(p => 
                p.projectName === group.projectName || p.projectId === group.projectId
              );

              const testerInfo = { 
                email: tester.email || "بدون بريد", 
                phone: tester.phone || "" 
              };

              if (projectEntry) {
                // إضافة المختبر للمشروع إذا لم يكن موجوداً
                if (!projectEntry.testers.find(t => t.email === testerInfo.email)) {
                  projectEntry.testers.push(testerInfo);
                }
              } else {
                // إضافة المشروع كمشاركة جديدة لهذا اليوم
                newSchedule[normalizedDay].push({
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
      console.error("Firestore Load Error:", error);
      setLoading(false);
      toast({ title: "خطأ في الاتصال", description: "فشل تحميل بيانات المختبرين من النظام.", variant: "destructive" });
    });

    return () => unsub();
  }, [isOpen, toast]);

  const handleSendWhatsApp = (project: ScheduleProject, day: string) => {
    const testersWithPhone = project.testers.filter((t) => !!t.phone);
    
    if (testersWithPhone.length === 0) {
      toast({ 
        title: "تنبيه", 
        description: "لا توجد أرقام هواتف مسجلة لمختبري هذا المشروع في هذا اليوم.", 
        variant: "destructive" 
      });
      return;
    }

    testersWithPhone.forEach((tester, index) => {
      let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone;
      } else if (!cleanPhone.startsWith('2')) {
        cleanPhone = '20' + cleanPhone;
      }

      const message = `*تنبيه بمهمة اختبار - يوم ${day}* 🚀

مرحباً، نود تذكيركم بمهمة الاختبار المقررة لكم اليوم لمشروع: *${project.projectName}*

*رابط نسخة الاختبار / المرفقات:*
🔗 ${project.resourceLink || 'سيتم تزويدكم به لاحقاً'}

${project.notes ? `*تعليمات الإدارة:*
📝 ${project.notes}` : ''}

يرجى البدء في الاختبار وموافاتنا بالتقرير فور الانتهاء.
بالتوفيق، فريق APP STORE.`;

      const encodedMessage = encodeURIComponent(message);
      
      // تأخير بسيط لمنع حظر المتصفح للنوافذ المتعددة
      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
      }, index * 1300);
    });

    toast({ 
      title: "جاري إرسال التنبيهات", 
      description: `يتم الآن التواصل مع ${testersWithPhone.length} مختبر لمشروع ${project.projectName}.` 
    });
  };
  
  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>جدول الاختبارات الأسبوعي</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; background: #fff; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 40px; border-bottom: 4px solid #1e293b; padding-bottom: 20px; }
            .day-section { margin-bottom: 50px; page-break-inside: avoid; }
            .day-title { font-size: 24px; font-weight: 900; color: #fff; background: #1e293b; padding: 10px 30px; border-radius: 15px; display: inline-block; margin-bottom: 20px; }
            .project-card { border: 2px solid #f1f5f9; border-radius: 20px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .project-name { font-weight: 900; font-size: 18px; color: #2563eb; margin-bottom: 15px; border-right: 5px solid #2563eb; padding-right: 15px; }
            .testers-list { display: grid; grid-template-cols: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .tester-item { font-size: 14px; color: #475569; background: #f8fafc; padding: 10px 15px; border-radius: 12px; font-weight: 700; border: 1px solid #e2e8f0; }
            .notes { margin-top: 15px; padding: 10px; background: #fffbeb; border-radius: 10px; font-size: 12px; color: #92400e; }
          </style>
        </head>
        <body>
          <h1>جدول توزيع مهام الاختبار الأسبوعي - وكالة APP STORE</h1>
          ${DAYS_OF_WEEK.map(day => {
            const projects = schedule[day];
            if (!projects || projects.length === 0) return '';
            return `
              <div class="day-section">
                <div class="day-title">${day}</div>
                ${projects.map(p => `
                  <div class="project-card">
                    <div class="project-name">المشروع: ${p.projectName}</div>
                    ${p.notes ? `<div class="notes">📝 تعليمات: ${p.notes}</div>` : ''}
                    <div class="testers-list">
                      ${p.testers.map(t => `<div class="tester-item">👤 ${t.email} <br/> <small>📞 ${t.phone || 'بدون هاتف'}</small></div>`).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white" dir="rtl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md shadow-inner">
                <CalendarDays className="h-10 w-10 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight">جدول الاختبارات الأسبوعي</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold text-lg mt-1">عرض توزيع المهام اليومي لفريق الجودة</DialogDescription>
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
                      <h3 className="text-2xl font-black text-slate-800 bg-white px-8 py-3 rounded-2xl shadow-sm border-r-8 border-primary flex items-center gap-3">
                        {day}
                        <Badge variant="outline" className="rounded-lg h-7 font-black bg-primary/5 text-primary border-primary/20">
                          {projects.length} مشاريع
                        </Badge>
                      </h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all flex flex-col group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">مهمة عمل جارية</p>
                              <h4 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">{proj.projectName}</h4>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl">
                              <Info className="h-5 w-5 text-slate-300" />
                            </div>
                          </div>

                          <div className="space-y-4 mb-8 flex-1">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase pr-2">فريق الاختبار اليوم</span>
                              <div className="grid grid-cols-1 gap-2">
                                {proj.testers.map(tester => (
                                  <div key={tester.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="h-4 w-4" />
                                      </div>
                                      <span className="text-xs font-bold text-slate-600 truncate">{tester.email}</span>
                                    </div>
                                    {tester.phone && (
                                      <div className="flex items-center gap-1 shrink-0 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                                        <Phone className="h-3 w-3" />
                                        <span className="text-[10px] font-black" dir="ltr">{tester.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {proj.resourceLink && (
                              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between group/link">
                                <span className="text-[9px] font-black text-primary">رابط المرفقات</span>
                                <a href={proj.resourceLink} target="_blank" className="text-[9px] font-black text-primary underline flex items-center gap-1">
                                  فتح الرابط <ExternalLink className="h-2 w-2" />
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
                  <div className="p-10 bg-white rounded-full shadow-inner mb-4 animate-pulse">
                    <CalendarDays className="h-32 w-32 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-400">الجدول فارغ حالياً</h3>
                  <p className="text-lg font-bold text-slate-400 max-w-md mx-auto leading-relaxed">لم يتم تعيين أي مختبرين للمشاريع بالأيام المحددة. قم بإضافة مختبر وتحديد أيامه لتظهر هنا.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-10 bg-white border-t shrink-0 flex gap-4">
          <Button 
            onClick={handlePrint} 
            disabled={loading || Object.keys(schedule).every(day => schedule[day].length === 0)}
            className="flex-1 h-20 rounded-[1.5rem] font-black gap-4 text-2xl shadow-2xl active:scale-95 transition-all bg-slate-900 text-white hover:bg-slate-800"
          >
            <Printer className="h-8 w-8" />
            طباعة جدول التوزيع الأسبوعي
          </Button>
          <Button variant="outline" onClick={onClose} className="h-20 px-10 rounded-[1.5rem] font-black text-xl border-2">إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
