'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, ExternalLink } from "lucide-react";
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
    const unsub = onSnapshot(query(collection(db, "testing_groups")), (snap) => {
      setTestingGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [isOpen, profile]);

  const groupedSchedule = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    testingGroups.forEach(group => {
      if (group.status === 'completed') return;
      group.testers?.forEach((tester: any) => {
        tester.assignedDays?.forEach((day: string) => {
          if (!grouped[day]) grouped[day] = [];
          let existing = grouped[day].find(p => p.projectId === (group.projectId || group.id));
          const tInfo = { email: tester.email, phone: tester.phone, resourceLink: group.resourceLink, notes: group.notes, projectName: group.projectName, assignedDays: tester.assignedDays };
          if (existing) existing.testers.push(tInfo);
          else grouped[day].push({ projectId: group.projectId || group.id, projectName: group.projectName, resourceLink: group.resourceLink, notes: group.notes, testers: [tInfo] });
        });
      });
    });
    return Object.keys(grouped).sort((a, b) => (daySortOrder[a] || 99) - (daySortOrder[b] || 99)).reduce((acc, key) => { acc[key] = grouped[key]; return acc; }, {} as any);
  }, [testingGroups]);

  const handleSendDayNotifications = (day: string, dayProjects: any[]) => {
    let count = 0;
    dayProjects.forEach(proj => {
      proj.testers.forEach((t: any) => {
        if (!t.phone) return;
        count++;
        let phone = t.phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '2' + phone; else if (!phone.startsWith('2')) phone = '20' + phone;
        const msg = `*تنبيه مهمة اختبار - APP STORE* 🚀\n\nمرحباً، تم تكليفكم بمهمة اختبار لمشروع: *${proj.projectName}*\n\n*تفاصيل المواعيد:* 📅 ${t.assignedDays.join('، ')}\n*رابط النسخة والمرفقات:* 🔗 ${proj.resourceLink || 'سيتم تزويدكم به لاحقاً'}\n\n${proj.notes ? `*تعليمات إضافية:* 📝 ${proj.notes}` : ''}\n\nبالتوفيق، فريق إدارة الجودة.`;
        setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank'), count * 1000);
      });
    });
    toast({ title: `إرسال تنبيهات ${day}`, description: `تم فتح ${count} محادثة واتساب.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-4"><div className="p-2 bg-white/20 rounded-xl"><CalendarDays className="h-6 w-6" /></div><DialogTitle className="text-lg font-black">جدول الاختبارات الأسبوعي</DialogTitle></div>
          <Button onClick={() => window.print()} variant="outline" className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-black text-xs px-4">طباعة</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          {loading ? <Loader2 className="animate-spin mx-auto py-20" /> : Object.keys(groupedSchedule).length === 0 ? <div className="text-center py-20 opacity-30"><p className="font-black">لا توجد مهام حالياً</p></div> : (
            <div className="space-y-6">
              {Object.entries(groupedSchedule).map(([day, projects]: any) => (
                <div key={day} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="font-black text-base">{day}</h3>
                    <Button size="sm" onClick={() => handleSendDayNotifications(day, projects)} className="h-9 rounded-xl bg-green-500 hover:bg-green-600 font-black text-[10px] gap-2 px-5 shadow-lg"><MessageCircle className="h-3.5 w-3.5" /> إرسال تنبيهات اليوم</Button>
                  </div>
                  <div className="p-4 space-y-3">
                    {projects.map((proj: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border flex items-center justify-between gap-4">
                        <div className="min-w-0"><p className="font-black text-slate-800 text-xs truncate">{proj.projectName}</p><Badge variant="secondary" className="rounded-lg h-4 px-1.5 text-[8px] font-black mt-1">{proj.testers.length} مختبرين</Badge></div>
                        {proj.resourceLink && <a href={proj.resourceLink} target="_blank" className="h-9 w-9 rounded-xl bg-white border shadow-sm text-primary flex items-center justify-center"><ExternalLink className="h-4 w-4" /></a>}
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