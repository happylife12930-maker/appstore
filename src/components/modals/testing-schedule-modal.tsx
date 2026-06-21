
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CalendarDays, Printer, Mail, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Schedule {
  [day: string]: {
    projectName: string;
    testers: string[];
  }[];
}

const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function TestingScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [schedule, setSchedule] = React.useState<Schedule>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isOpen || !db) return;

    setLoading(true);
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      const groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const newSchedule: Schedule = {};

      groups.forEach((group: any) => {
        if (!group.testers) return;
        group.testers.forEach((tester: any) => {
          if (!tester.assignedDays) return;
          tester.assignedDays.forEach((day: string) => {
            // معالجة الاختلافات في المسميات (إن وجدت) لضمان المطابقة
            const normalizedDay = day.trim();
            
            if (!newSchedule[normalizedDay]) {
              newSchedule[normalizedDay] = [];
            }
            
            let projectEntry = newSchedule[normalizedDay].find(p => p.projectName === group.projectName);
            if (projectEntry) {
              if (!projectEntry.testers.includes(tester.email)) {
                  projectEntry.testers.push(tester.email);
              }
            } else {
              newSchedule[normalizedDay].push({
                projectName: group.projectName,
                testers: [tester.email],
              });
            }
          });
        });
      });
      
      setSchedule(newSchedule);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [isOpen]);
  
  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>جدول الاختبارات الأسبوعي</title>
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
                      ${task.testers.map(t => `<span class="tester-item">👤 ${t}</span>`).join('')}
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
                        <DialogDescription className="text-primary-foreground/70 font-bold">عرض مهام الاختبار الموزعة على أيام الأسبوع الحالية.</DialogDescription>
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
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 pr-2">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                        {day}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.map((task, index) => (
                        <div key={index} className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <p className="font-black text-primary mb-4 text-sm flex items-center gap-2">
                            <span className="p-1.5 bg-primary/10 rounded-lg text-primary text-[10px]">PROJ</span>
                            {task.projectName}
                          </p>
                          <div className="space-y-2">
                            {task.testers.map(email => (
                              <div key={email} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600 truncate">{email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(schedule).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <CalendarDays className="h-24 w-24 mb-4" />
                    <p className="text-xl font-black uppercase tracking-wider">لا توجد مهام اختبار مجدولة حالياً</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-8 bg-white border-t shrink-0">
          <Button 
            onClick={handlePrint} 
            disabled={Object.keys(schedule).length === 0}
            className="w-full h-14 rounded-2xl font-black gap-3 text-lg shadow-xl active:scale-95 transition-all"
          >
            <Printer className="h-6 w-6" />
            طباعة جدول المهام الأسبوعي
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
