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
      setTestingGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.warn("Schedule Fetch Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, profile]);

  const normalizeDay = (day: string) => {
    if (!day) return "";
    const d = day.trim();
    if (d.includes("أحد")) return "الأحد";
    if (d.includes("اثنين")) return "الاثنين";
    if (d.includes("ثلاثاء")) return "الثلاثاء";
    if (d.includes("أربعاء")) return "الأربعاء";
    if (d.includes("خميس")) return "الخميس";
    if (d.includes("جمعة")) return "الجمعة";
    if (d.includes("سبت")) return "السبت";
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
            phone: tester.phone,
            resourceLink: group.resourceLink,
            notes: group.notes,
            projectName: group.projectName
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

  const handleSendDayNotifications = (day: string, dayProjects: any[]) => {
    if (dayProjects.length === 0) return;

    let totalSent = 0;
    dayProjects.forEach(project => {
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
      <div style="margin-bottom: 15px; border: 1px solid #eee; padding: 10px; border-radius: 8px;">
        <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 14px;">${day}</h3>
        ${projects.map(p => `
          <div style="margin-top: 5px; border-right: 2px solid #3b82f6; padding-right: 8px;">
            <p style="font-size: 11px; margin: 2px 0; font-weight: bold;">${p.projectName}</p>
            <p style="font-size: 9px; margin: 0; color: #666;">المختبرون: ${p.testers.map((t:any) => t.email).join('، ')}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl"><body style="font-family: 'Cairo', sans-serif; padding: 20px;">
        <h2 style="text-align: center; font-size: 18px;">جدول مهام الاختبار الأسبوعية</h2>
        ${content}
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[80vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-3 text-primary-foreground flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <DialogTitle className="text-xs font-black">جدول الاختبارات الأسبوعي</DialogTitle>
          </div>
          <Button onClick={handlePrint} variant="outline" className="h-7 rounded-lg bg-white/10 border-white/20 text-white font-black text-[9px] gap-1 px-2">
            <Printer className="h-3.5 w-3.5" /> طباعة
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-[9px] font-black text-slate-400">جاري التحميل...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-16 opacity-30">
              <CalendarDays className="h-12 w-12 mx-auto mb-2" />
              <p className="font-black text-xs">لا توجد مهام مسجلة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedSchedule).map(([day, dayProjects]) => (
                <div key={day} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="font-black text-[11px]">{day}</h3>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, dayProjects)}
                      className="h-7 rounded-lg bg-green-500 hover:bg-green-600 font-black text-[9px] gap-1.5 px-3"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-3 space-y-2">
                    {dayProjects.map((proj, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-[10px] truncate">{proj.projectName}</p>
                          <p className="text-[9px] text-slate-400 font-bold truncate">المختبرون: {proj.testers.length}</p>
                        </div>
                        {proj.resourceLink && (
                          <a href={proj.resourceLink} target="_blank" className="h-7 w-7 rounded-lg bg-white border shadow-sm text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <ExternalLink className="h-3.5 w-3.5" />
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