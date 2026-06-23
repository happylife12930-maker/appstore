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
          const tInfo = { 
            email: tester.email, 
            phone: tester.phone, 
            resourceLink: group.resourceLink, 
            notes: group.notes, 
            projectName: group.projectName, 
            assignedDays: tester.assignedDays 
          };
          if (existing) {
            if (!existing.testers.some((t: any) => t.email === tester.email)) {
              existing.testers.push(tInfo);
            }
          } else {
            grouped[day].push({ 
              projectId: group.projectId || group.id, 
              projectName: group.projectName, 
              resourceLink: group.resourceLink, 
              notes: group.notes, 
              testers: [tInfo] 
            });
          }
        });
      });
    });
    return Object.keys(grouped)
      .sort((a, b) => (daySortOrder[a] || 99) - (daySortOrder[b] || 99))
      .reduce((acc, key) => { acc[key] = grouped[key]; return acc; }, {} as any);
  }, [testingGroups]);

  const handleSendDayNotifications = (day: string, dayProjects: any[]) => {
    let count = 0;
    dayProjects.forEach(proj => {
      proj.testers.forEach((t: any) => {
        if (!t.phone) return;
        count++;
        let phone = t.phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '2' + phone; 
        else if (!phone.startsWith('2')) phone = '20' + phone;

        const message = `*تنبيه مهمة اختبار - APP STORE* 🚀

مرحباً، تم تكليفكم بمهمة اختبار لمشروع: *${proj.projectName}*

*تفاصيل المواعيد المقررة:*
📅 ${t.assignedDays.join('، ')}

*رابط نسخة الاختبار والمرفقات:*
🔗 ${proj.resourceLink || 'سيتم تزويدكم به لاحقاً'}

${proj.notes ? `*تعليمات إضافية:*
📝 ${proj.notes}` : ''}

يرجى البدء وموافاتنا بالنتائج فور الانتهاء.
بالتوفيق، فريق إدارة الجودة.`;

        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }, count * 1000);
      });
    });
    toast({ 
      title: `إرسال تنبيهات يوم ${day}`, 
      description: `يتم الآن فتح ${count} محادثة واتساب لكافة المختبرين.` 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CalendarDays className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
          </div>
          <Button onClick={() => window.print()} variant="outline" className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-black text-xs px-4 gap-2">
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-black text-sm">جاري جلب الجدول...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <CalendarDays className="h-16 w-16 mx-auto mb-4" />
              <p className="font-black">لا توجد مهام اختبار مجدولة حالياً</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchedule).map(([day, projects]: any) => (
                <div key={day} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg">{day}</h3>
                      <Badge variant="secondary" className="bg-white/10 text-white border-none rounded-lg h-5">{projects.length} مشاريع</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, projects)} 
                      className="h-10 rounded-xl bg-green-500 hover:bg-green-600 font-black text-xs gap-2 px-5 shadow-lg active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" /> إرسال تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-4 space-y-3">
                    {projects.map((proj: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 group hover:bg-white transition-colors">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-sm truncate">{proj.projectName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="rounded-lg h-5 px-2 text-[9px] font-black border-primary/20 text-primary">
                              {proj.testers.length} مختبرين
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {proj.resourceLink && (
                            <a 
                              href={proj.resourceLink} 
                              target="_blank" 
                              className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                              title="فتح الرابط"
                            >
                              <ExternalLink className="h-5 w-5" />
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
