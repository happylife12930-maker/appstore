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
      <div style="margin-bottom: 20px; border: 2px solid #e2e8f0; padding: 15px; border-radius: 15px; page-break-inside: avoid;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; border-bottom: 2px solid #primary; padding-bottom: 5px;">${day}</h3>
        ${projects.map(p => `
          <div style="margin-top: 10px; border-right: 4px solid #3b82f6; padding-right: 12px; margin-bottom: 10px;">
            <p style="font-size: 14px; margin: 2px 0; font-weight: 900;">${p.projectName}</p>
            <p style="font-size: 12px; margin: 0; color: #64748b;">المختبرون: ${p.testers.map((t:any) => t.email).join('، ')}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl"><body style="font-family: 'Cairo', sans-serif; padding: 40px; background: white;">
        <h2 style="text-align: center; font-size: 24px; font-weight: 900; margin-bottom: 30px; border-bottom: 4px solid #1e293b; padding-bottom: 15px;">جدول مهام الاختبار الأسبوعية - APP STORE</h2>
        ${content}
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CalendarDays className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">جدول الاختبارات الأسبوعي</DialogTitle>
          </div>
          <Button onClick={handlePrint} variant="outline" className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-black text-sm gap-2 px-4 hover:bg-white/20">
            <Printer className="h-4 w-4" /> طباعة الجدول
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-black text-slate-400">جاري مزامنة الجدول...</p>
            </div>
          ) : Object.keys(groupedSchedule).length === 0 ? (
            <div className="text-center py-24 opacity-30 flex flex-col items-center gap-4">
              <CalendarDays className="h-20 w-20" />
              <p className="font-black text-xl">لا توجد مهام اختبار مجدولة حالياً</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchedule).map(([day, dayProjects]) => (
                <div key={day} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="font-black text-lg">{day}</h3>
                    <Button 
                      size="sm" 
                      onClick={() => handleSendDayNotifications(day, dayProjects)}
                      className="h-10 rounded-xl bg-green-500 hover:bg-green-600 font-black text-xs gap-2 px-6 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" /> إرسال تنبيهات اليوم
                    </Button>
                  </div>
                  <div className="p-4 space-y-3">
                    {dayProjects.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-sm truncate">{proj.projectName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="rounded-lg h-5 px-2 text-[10px] font-black">{proj.testers.length} مختبرين</Badge>
                          </div>
                        </div>
                        {proj.resourceLink && (
                          <a href={proj.resourceLink} target="_blank" className="h-10 w-10 rounded-xl bg-white border shadow-sm text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <ExternalLink className="h-5 w-5" />
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
