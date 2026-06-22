
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, ExternalLink, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

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
    if (!isOpen || !db || profile?.role !== 'admin') return;

    setLoading(true);
    const q = query(collection(db, "testing_groups"));
    const unsub = onSnapshot(q, (snap) => {
      setTestingGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Schedule Listener Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, profile]);

  const normalizeDay = (day: string) => {
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
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push({
            projectName: group.projectName,
            testerEmail: tester.email,
            testerPhone: tester.phone,
            resourceLink: group.resourceLink,
            notes: group.notes
          });
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

  const handleSendDayNotifications = (day: string, tasks: any[]) => {
    if (tasks.length === 0) return;

    tasks.forEach((task, index) => {
      if (!task.testerPhone) return;

      let cleanPhone = task.testerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
      else if (!cleanPhone.startsWith('2')) cleanPhone = '20' + cleanPhone;

      const message = `*تنبيه مهمة اختبار ليوم ${day}* 🚀\n\n` +
        `المشروع: *${task.projectName}*\n` +
        `رابط النسخة: ${task.resourceLink || 'سيتم إرساله لاحقاً'}\n` +
        `${task.notes ? `تعليمات: ${task.notes}` : ''}\n\n` +
        `يرجى المتابعة والبدء في الاختبار. بالتوفيق.`;

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }, index * 800);
    });

    toast({ title: `إرسال تنبيهات ${day}`, description: `جاري التواصل مع ${tasks.length} مختبرين.` });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = Object.entries(groupedSchedule).map(([day, tasks]) => `
      <div style="margin-bottom: 15px; border: 1px solid #eee; padding: 12px; border-radius: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">${day}</h3>
        ${tasks.map(t => `<p style="font-size: 11px; margin: 3px 0;"><b>${t.projectName}:</b> ${t.testerEmail}</p>`).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head><title>جدول الاختبارات</title><style>body { font-family: 'Cairo', sans-serif; padding: 20px; }</style></head>
        <body>
          <h2 style="text-align: center; font-size: 18px;">جدول الاختبارات الأسبوعي</h2>
          ${content || '<p style="text-align: center;">لا توجد مهام حالية</p>'}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[80vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-4 text-primary-foreground shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <DialogTitle className="text-sm font-black">جدول الاختبارات الأسبوعي</DialogTitle>
            </div>
            <Button onClick={handlePrint} variant="outline" className="h-8 rounded-lg bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-[10px] gap-1.5">
              <Printer className="h-3.5 w-3.5" /> طباعة
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-[10px] font-black text-slate-400">جاري جلب الجدول...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-16 opacity-30">
              <CalendarDays className="h-12 w-12 mx-auto mb-2" />
              <p className="font-black text-xs">لا توجد مهام اختبار مجدولة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(groupedSchedule).map(([day, tasks]) => (
                <div key={day} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="font-black text-[11px]">{day}</h3>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, tasks)}
                      className="h-7 rounded-lg bg-green-500 hover:bg-green-600 font-black text-[9px] gap-1.5 px-3"
                    >
                      <MessageCircle className="h-3 w-3" /> إرسال تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {tasks.map((task, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-50 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-[10px] truncate">{task.projectName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <User className="h-2.5 w-2.5 text-slate-400" />
                            <p className="text-[9px] font-bold text-slate-400 truncate">{task.testerEmail}</p>
                          </div>
                        </div>
                        {task.resourceLink && (
                          <a href={task.resourceLink} target="_blank" className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
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
