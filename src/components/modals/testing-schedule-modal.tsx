'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, MessageCircle, CalendarDays, User, Briefcase, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
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
  const [agencySettings, setAgencySettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedDay, setExpandedDay] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !db) {
      if (!isOpen) setLoading(true);
      return;
    }

    // جلب إعدادات الوكالة للشعار
    onSnapshot(doc(db, "settings", "agency"), (snap) => {
      if (snap.exists()) setAgencySettings(snap.data());
    });

    const unsub = onSnapshot(query(collection(db, "testing_groups")), (snap) => {
      setTestingGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [isOpen]);

  const groupedSchedule = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    testingGroups.forEach(group => {
      if (group.status === 'completed') return;
      group.testers?.forEach((tester: any) => {
        tester.assignedDays?.forEach((day: string) => {
          if (!grouped[day]) grouped[day] = [];
          
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

    const message = `*تنبيه مهمة اختبار - APP STORE* 🚀\n\nمرحباً، تم تكليفكم بمهمة اختبار لمشروع: *${tester.projectName}*\n\n*تفاصيل المواعيد المقررة:*\n📅 ${tester.assignedDays.join('، ')}\n\n*رابط نسخة الاختبار والمرفقات:*\n🔗 ${tester.resourceLink || 'سيتم تزويدكم به لاحقاً'}\n\n${tester.notes ? `*تعليمات إضافية:*\n📝 ${tester.notes}` : ''}\n\nيرجى البدء وموافاتنا بالنتائج فور الانتهاء.\nبالتوفيق، فريق إدارة الجودة.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) return;

    const logoUrl = agencySettings?.logoUrl || "https://i.ibb.co/v4m0Dyc/logo.png";
    const today = new Date().toLocaleDateString('ar-EG');

    let scheduleHtml = '';
    Object.entries(groupedSchedule).forEach(([day, testers]: any) => {
      scheduleHtml += `
        <div class="day-section">
          <h3 class="day-title">يوم ${day}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 35%">اسم المشروع</th>
                <th style="width: 40%">المختبر (البريد الإلكتروني)</th>
                <th style="width: 25%">رقم الهاتف</th>
              </tr>
            </thead>
            <tbody>
              ${testers.map((t: any) => `
                <tr>
                  <td class="font-black">${t.projectName}</td>
                  <td class="font-bold">${t.email}</td>
                  <td class="font-mono" dir="ltr">${t.phone || '---'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير جدول الاختبارات الأسبوعي</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; background: #fff; }
            .header { text-align: center; border-bottom: 4px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 70px; margin-bottom: 10px; }
            .brand { font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
            .report-title { font-size: 18px; font-weight: 700; color: #64748b; margin-top: 5px; text-decoration: underline; }
            .day-section { margin-bottom: 40px; break-inside: avoid; }
            .day-title { background: #f1f5f9; padding: 10px 15px; border-right: 6px solid #1e293b; font-weight: 900; font-size: 16px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #1e293b; color: #fff; padding: 12px; text-align: right; font-size: 11px; font-weight: 700; }
            td { border: 1px solid #e2e8f0; padding: 12px; font-size: 13px; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .font-mono { font-family: monospace; color: #64748b; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              @page { size: A4; margin: 15mm; }
              body { padding: 0; }
              .header { margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" class="logo" />
            <div class="brand">APP STORE AGENCY</div>
            <div class="report-title">جدول الاختبارات الأسبوعي المعتمد</div>
            <p style="margin-top: 10px; font-size: 11px; font-weight: 700; color: #94a3b8;">تاريخ الاستخراج: ${today}</p>
          </div>

          ${scheduleHtml || '<p style="text-align:center; padding: 50px; color: #94a3b8;">لا توجد مهام اختبار مجدولة حالياً.</p>'}

          <div class="footer">
            <p>مستند إلكتروني معتمد صادر عن نظام إدارة الجودة - وكالة APP STORE</p>
            <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة.</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[85vh] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CalendarDays className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black">جدول الاختبارات الأسبوعي</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-black text-xs px-4 gap-2 hover:bg-white/20">
              <Printer className="h-4 w-4" /> طباعة الجدول الشامل
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
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
                    <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-lg">{day}</h3>
                        <Badge variant="secondary" className="bg-white/10 text-white border-none rounded-lg h-5 font-black text-[10px]">
                          {testers.length} مهام
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setExpandedDay(isExpanded ? null : day)} 
                        className={cn(
                          "h-10 rounded-xl font-black text-xs gap-2 px-5 transition-all shadow-lg",
                          isExpanded ? "bg-slate-700" : "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        <MessageCircle className="h-4 w-4" /> 
                        {isExpanded ? "إغلاق" : "اختيار المختبرين"}
                      </Button>
                    </div>

                    <div className={cn(!isExpanded && "hidden")}>
                      <div className="p-4 space-y-3">
                        {testers.map((tester: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                <User className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-slate-800 text-sm truncate">{tester.email}</p>
                                <p className="text-[10px] font-bold text-primary truncate flex items-center gap-1">
                                  <Briefcase className="h-2.5 w-2.5" /> مشروع: {tester.projectName}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleSendIndividualNotification(tester)}
                              className="h-10 w-10 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md shrink-0 active:scale-90"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

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
        
        <div className="p-4 bg-slate-50 border-t text-center">
          <p className="text-[10px] font-bold text-slate-400">
            استخدم زر الطباعة للحصول على كشف كامل بكافة التفاصيل لجميع الأيام.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
