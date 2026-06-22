
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

interface TestingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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
    // نستخدم testing_groups بدلاً من testing_schedule لتوحيد البيانات
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

  const groupedSchedule = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    testingGroups.forEach(group => {
      if (group.status === 'completed') return; // تجاهل المنتهي

      group.testers.forEach((tester: any) => {
        tester.assignedDays.forEach((day: string) => {
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

      const message = `*تذكير بمهمة اختبار ليوم ${day}* 🚀\n\n` +
        `المشروع: *${task.projectName}*\n` +
        `رابط النسخة: ${task.resourceLink || 'سيتم إرساله لاحقاً'}\n` +
        `${task.notes ? `تعليمات: ${task.notes}` : ''}\n\n` +
        `يرجى المتابعة والبدء في الاختبار. بالتوفيق.`;

      setTimeout(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }, index * 800);
    });

    toast({ title: `إرسال تنبيهات ${day}`, description: `جاري فتح محادثات لـ ${tasks.length} مختبرين.` });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = Object.entries(groupedSchedule).map(([day, tasks]) => `
      <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 10px;">
        <h3 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #primary;">${day}</h3>
        ${tasks.map(t => `<p style="font-size: 14px; margin: 5px 0;"><b>${t.projectName}:</b> ${t.testerEmail}</p>`).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head><title>جدول الاختبارات</title><style>body { font-family: 'Cairo', sans-serif; padding: 30px; }</style></head>
        <body>
          <h1 style="text-align: center;">جدول الاختبارات الأسبوعي</h1>
          ${content || '<p style="text-align: center;">لا توجد مهام حالية</p>'}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-5 text-primary-foreground shrink-0 shadow-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><CalendarDays className="h-5 w-5" /></div>
                <div>
                  <DialogTitle className="text-xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
                  <DialogDescription className="text-primary-foreground/70 text-[10px] font-bold">توزيع المهام والمشاريع على أيام الأسبوع</DialogDescription>
                </div>
              </div>
              <Button onClick={handlePrint} variant="outline" className="h-9 rounded-xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-xs gap-2">
                <Printer className="h-4 w-4" /> طباعة
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-black text-slate-400">جاري جلب الجدول الأسبوعي...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <CalendarDays className="h-16 w-16 mx-auto mb-4" />
              <p className="font-black text-lg">لا توجد مهام اختبار مجدولة حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSchedule).map(([day, tasks]) => (
                <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="font-black text-sm">{day}</h3>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, tasks)}
                      className="h-8 rounded-lg bg-green-500 hover:bg-green-600 font-black text-[10px] gap-2 px-3 shadow-lg"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> إرسال تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-3 divide-y divide-slate-50">
                    {tasks.map((task, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-xs truncate">{task.projectName}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{task.testerEmail}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {task.resourceLink && (
                            <a href={task.resourceLink} target="_blank" className="h-7 w-7 rounded-lg bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
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
