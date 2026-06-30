'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, ExternalLink, User, ChevronDown, ChevronUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [expandedDay, setExpandedDay] = React.useState<string | null>(null);

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
          
          // إضافة المختبر لليوم مع بيانات المشروع
          grouped[day].push({
            email: tester.email,
            phone: tester.phone,
            projectName: group.projectName,
            resourceLink: group.resourceLink,
            notes: group.notes,
            assignedDays: tester.assignedDays
          });
        });
      });
    });
    
    // ترتيب الأيام حسب الترتيب المنطقي
    return Object.keys(grouped)
      .sort((a, b) => (daySortOrder[a] || 99) - (daySortOrder[b] || 99))
      .reduce((acc, key) => { acc[key] = grouped[key]; return acc; }, {} as any);
  }, [testingGroups]);

  const handleSendIndividualNotification = (tester: any) => {
    if (!tester.phone) {
      toast({ title: "خطأ", description: "هذا المختبر لا يملك رقم هاتف مسجل.", variant: "destructive" });
      return;
    }

    let phone = String(tester.phone).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '2' + phone; 
    } else if (!phone.startsWith('2')) {
      phone = '20' + phone;
    }

    const message = `*تنبيه مهمة اختبار - APP STORE* 🚀

مرحباً، تم تكليفكم بمهمة اختبار لمشروع: *${tester.projectName}*

*تفاصيل المواعيد المقررة:*
📅 ${tester.assignedDays.join('، ')}

*رابط نسخة الاختبار والمرفقات:*
🔗 ${tester.resourceLink || 'سيتم تزويدكم به لاحقاً'}

${tester.notes ? `*تعليمات إضافية:*
📝 ${tester.notes}` : ''}

يرجى البدء وموافاتنا بالنتائج فور الانتهاء.
بالتوفيق، فريق إدارة الجودة.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    toast({ 
      title: "فتح الواتساب", 
      description: `يتم الآن الانتقال لمحادثة ${tester.email}` 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CalendarDays className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
          </div>
          <Button onClick={() => window.print()} variant="outline" className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-black text-xs px-4 gap-2 no-print">
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar">
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
              {Object.entries(groupedSchedule).map(([day, testers]: any) => {
                const isExpanded = expandedDay === day;
                return (
                  <div key={day} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
                    {/* Day Header */}
                    <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-lg">{day}</h3>
                        <Badge variant="secondary" className="bg-white/10 text-white border-none rounded-lg h-5 font-black text-[10px]">
                          {testers.length} مهام اختبار
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setExpandedDay(isExpanded ? null : day)} 
                        className={cn(
                          "h-10 rounded-xl font-black text-xs gap-2 px-5 transition-all shadow-lg active:scale-95",
                          isExpanded ? "bg-slate-700 hover:bg-slate-600" : "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        <MessageCircle className="h-4 w-4" /> 
                        {isExpanded ? "إغلاق القائمة" : "اختيار المختبرين"}
                        {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      </Button>
                    </div>

                    {/* Testers List for the Day */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">فريق الاختبار المقرر اليوم:</p>
                          {testers.map((tester: any, idx: number) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:border-primary/20 transition-all group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                  <User className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-800 text-sm truncate">{tester.email}</p>
                                  <p className="text-[10px] font-bold text-primary truncate">مشروع: {tester.projectName}</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleSendIndividualNotification(tester)}
                                className="h-10 w-10 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md shrink-0 active:scale-90 transition-all"
                                title="إرسال واتساب"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick View when not expanded */}
                    {!isExpanded && (
                      <div className="p-4 flex flex-wrap gap-2">
                        {Array.from(new Set(testers.map((t: any) => t.projectName))).map((projName: any) => (
                          <Badge key={projName} variant="outline" className="rounded-lg h-6 px-3 text-[10px] font-black border-slate-200 bg-slate-50 text-slate-600">
                            {projName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t text-center">
          <p className="text-[10px] font-bold text-slate-400">
            يرجى الإرسال لكل مختبر بشكل منفصل لضمان استقرار الخدمة.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
