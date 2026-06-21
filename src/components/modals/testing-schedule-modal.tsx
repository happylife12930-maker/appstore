
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CalendarDays, Printer, Mail, X, MessageCircle, Phone } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  [day: string]: {
    projectName: string;
    resourceLink?: string;
    notes?: string;
    testers: {
      email: string;
      phone: string;
    }[];
  }[];
}

const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function TestingScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [schedule, setSchedule] = React.useState<Schedule>({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen || !db) return;

    setLoading(true);
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      const groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const newSchedule: Schedule = {};

      groups.forEach((group: any) => {
        if (!group.testers || !Array.isArray(group.testers)) return;
        
        group.testers.forEach((tester: any) => {
          if (!tester.assignedDays || !Array.isArray(tester.assignedDays)) return;
          
          tester.assignedDays.forEach((day: string) => {
            const normalizedDay = day.trim();
            
            if (!newSchedule[normalizedDay]) {
              newSchedule[normalizedDay] = [];
            }
            
            let projectEntry = newSchedule[normalizedDay].find(p => p.projectName === group.projectName);
            
            if (projectEntry) {
              // إضافة المختبر إذا لم يكن موجوداً لهذا المشروع في هذا اليوم
              if (!projectEntry.testers.find(t => t.email === tester.email)) {
                projectEntry.testers.push({ 
                  email: tester.email, 
                  phone: tester.phone || "" 
                });
              }
            } else {
              newSchedule[normalizedDay].push({
                projectName: group.projectName,
                resourceLink: group.resourceLink,
                notes: group.notes,
                testers: [{ 
                  email: tester.email, 
                  phone: tester.phone || "" 
                }],
              });
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

  const handleSendWhatsApp = (project: any, day: string) => {
    const testersWithPhone = project.testers.filter((t: any) => !!t.phone);
    
    if (testersWithPhone.length === 0) {
      toast({ 
        title: "تنبيه", 
        description: "لا توجد أرقام هواتف مسجلة لمختبري هذا المشروع.", 
        variant: "destructive" 
      });
      return;
    }

    testersWithPhone.forEach((tester: any, index: number) => {
      let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone;
      } else if (!cleanPhone.startsWith('2')) {
        cleanPhone = '20' + cleanPhone;
      }

      const message = `*تذكير مهمة اختبار ليوم ${day}* 🚀

مرحباً، نذكركم بمهمة الاختبار المقررة لكم اليوم لمشروع: *${project.projectName}*

*رابط نسخة الاختبار:*
🔗 ${project.resourceLink || 'سيتم تزويدكم به لاحقاً'}

${project.notes ? `*ملاحظات الإدارة:*
📝 ${project.notes}` : ''}

يرجى إرسال تقرير الاختبار فور الانتهاء.
بالتوفيق، فريق APP STORE.`;

      const encodedMessage = encodeURIComponent(message);
      
      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
      }, index * 1000);
    });

    toast({ 
      title: "جاري الإرسال", 
      description: `يتم الآن فتح ${testersWithPhone.length} محادثة واتساب لمختبري يوم ${day}.` 
    });
  };
  
  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>جدول الاختبارات الأسبوعي الشامل</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 30px; background: #fff; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 30px; border-bottom: 3px solid #1e293b; padding-bottom: 15px; }
            .day-section { margin-bottom: 40px; }
            .day-title { font-size: 22px; font-weight: 900; color: #1e293b; background: #f8fafc; padding: 10px 20px; border-right: 5px solid #1e293b; margin-bottom: 15px; }
            .project-card { border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; margin-bottom: 15px; background: #fff; }
            .project-name { font-weight: 900; font-size: 16px; color: #2563eb; margin-bottom: 10px; }
            .testers-list { display: flex; flex-wrap: wrap; gap: 10px; list-style: none; padding: 0; }
            .tester-item { font-size: 13px; color: #475569; background: #f1f5f9; padding: 5px 12px; border-radius: 8px; font-weight: 700; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>جدول الاختبارات الأسبوعي - APP STORE</h1>
          ${daysOfWeek.map(day => {
            const tasks = schedule[day];
            if (!tasks || tasks.length === 0) return '';
            return `
              <div class="day-section">
                <div class="day-title">${day}</div>
                ${tasks.map(task => `
                  <div class="project-card">
                    <div class="project-name">📁 مشروع: ${task.projectName}</div>
                    <div class="testers-list">
                      ${task.testers.map(t => `<span class="tester-item">👤 ${t.email} (${t.phone || 'بدون هاتف'})</span>`).join('')}
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
      setTimeout(() => { printWindow.print(); }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col rounded-[2.5rem] p-0 border-none shadow-2xl" dir="rtl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <CalendarDays className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-bold">عرض وتذكير مهام الاختبار الموزعة على مدار الأسبوع.</DialogDescription>
                    </div>
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
                    <X />
                </Button>
            </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-8 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-bold text-slate-500">جاري تجميع الجدول...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {daysOfWeek.map(day => {
                const tasks = schedule[day];
                if (!tasks || tasks.length === 0) return null;
                return (
                  <div key={day} className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 pr-2 border-r-4 border-primary px-4 bg-white/50 py-2 rounded-l-2xl shadow-sm">
                        {day}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.length} مهام</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tasks.map((task, index) => (
                        <div key={index} className="p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-4">
                                <p className="font-black text-primary text-sm flex items-center gap-2">
                                    <span className="p-1.5 bg-primary/10 rounded-lg text-primary text-[10px] font-black">مشروع</span>
                                    {task.projectName}
                                </p>
                            </div>
                            <div className="space-y-2 mb-6">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">المختبرون المجدولون</span>
                                {task.testers.map(tester => (
                                    <div key={tester.email} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-50">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                            <span className="text-[10px] font-bold text-slate-600 truncate">{tester.email}</span>
                                        </div>
                                        {tester.phone && (
                                            <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-lg border">
                                                <Phone className="h-2.5 w-2.5 text-slate-300" />
                                                <span className="text-[9px] font-black text-slate-400" dir="ltr">{tester.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleSendWhatsApp(task, day)}
                            size="sm"
                            className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-[10px] gap-2 shadow-sm mt-auto"
                          >
                            <MessageCircle className="h-4 w-4" /> إرسال تنبيهات يوم {day}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(schedule).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <div className="p-6 bg-white rounded-full shadow-inner mb-4">
                        <CalendarDays className="h-20 w-20 text-slate-400" />
                    </div>
                    <p className="text-xl font-black text-slate-500">لا توجد مهام اختبار مجدولة حالياً</p>
                    <p className="text-sm font-bold text-slate-400 mt-2">قم بإضافة مختبرين وتحديد أيام العمل لهم لتظهر هنا.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-8 bg-white border-t shrink-0">
          <Button 
            onClick={handlePrint} 
            disabled={Object.keys(schedule).length === 0}
            className="w-full h-16 rounded-2xl font-black gap-3 text-xl shadow-xl active:scale-95 transition-all"
          >
            <Printer className="h-6 w-6" />
            طباعة الجدول الأسبوعي للمختبرين
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
