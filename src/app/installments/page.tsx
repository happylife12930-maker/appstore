"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CalendarDays, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  Wallet,
  ArrowRight,
  TrendingUp,
  Printer,
  BellRing,
  FilterX,
  Calendar as CalendarIcon,
  MessageCircle,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterType = 'all' | 'paid' | 'pending' | 'overdue';

function InstallmentsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role !== 'admin' && !loading) {
      router.push("/");
      return;
    }
    if (!db) return;

    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile, router, loading]);

  const projectsWithInstallments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients
      .filter(c => c.paymentType === 'installments' && c.installments?.length > 0)
      .map(c => {
        const installments = c.installments.map((inst: any) => {
          const dueDate = inst.dueDate ? new Date(inst.dueDate) : null;
          const isOverdue = inst.status === 'pending' && dueDate && dueDate < today;
          return { ...inst, isOverdue };
        });

        const totalAmount = installments.reduce((acc: number, inst: any) => acc + (inst.amount || 0), 0);
        const paidAmount = installments.filter((inst: any) => inst.status === 'paid').reduce((acc: number, inst: any) => acc + (inst.amount || 0), 0);
        const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
        
        return {
          clientId: c.id,
          clientName: c.name,
          clientPhone: c.phone,
          clientPhone2: c.phone2,
          projectName: c.projectName || "مشروع بدون اسم",
          installments,
          progress,
          paidAmount,
          totalAmount,
          hasOverdue: installments.some((i: any) => i.isOverdue)
        };
      });
  }, [clients]);

  const filteredData = useMemo(() => {
    const s = searchQuery.toLowerCase();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return projectsWithInstallments
      .map(project => {
        const filteredInstallments = project.installments.filter((inst: any) => {
          let matchesStatus = true;
          if (currentFilter === 'paid') matchesStatus = inst.status === 'paid';
          else if (currentFilter === 'pending') matchesStatus = inst.status === 'pending';
          else if (currentFilter === 'overdue') matchesStatus = inst.isOverdue;

          let matchesDate = true;
          if (inst.dueDate) {
            const instDate = new Date(inst.dueDate);
            if (start && instDate < start) matchesDate = false;
            if (end && instDate > end) matchesDate = false;
          } else if (start || end) {
            matchesDate = false;
          }

          return matchesStatus && matchesDate;
        });

        return { ...project, installments: filteredInstallments };
      })
      .filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(s) || p.clientName.toLowerCase().includes(s) || (p.clientPhone && p.clientPhone.includes(searchQuery)) || (p.clientPhone2 && p.clientPhone2.includes(searchQuery));
        const hasMatchingInstallments = p.installments.length > 0;
        return matchesSearch && hasMatchingInstallments;
      });
  }, [projectsWithInstallments, searchQuery, currentFilter, startDate, endDate]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let paid = 0;
    let overdueCount = 0;
    
    filteredData.forEach(p => {
      p.installments.forEach((inst: any) => {
        if (inst.status === 'paid') paid += inst.amount;
        else {
          pending += inst.amount;
          if (inst.isOverdue) overdueCount++;
        }
        total += inst.amount;
      });
    });
    return { total, pending, paid, overdueCount };
  }, [filteredData]);

  const toggleInstallmentStatus = async (clientId: string, instIndex: number) => {
    if (!db) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const targetInst = filteredData.find(p => p.clientId === clientId)?.installments[instIndex];
    if (!targetInst) return;

    const originalIndex = client.installments.findIndex((inst: any) => 
      inst.amount === targetInst.amount && inst.dueDate === targetInst.dueDate
    );

    if (originalIndex === -1) return;

    const newInstallments = [...client.installments];
    const currentStatus = newInstallments[originalIndex].status;
    newInstallments[originalIndex].status = currentStatus === 'paid' ? 'pending' : 'paid';

    const amount = newInstallments[originalIndex].amount || 0;
    const newTotalPayments = currentStatus === 'paid' 
      ? (client.totalPayments || 0) - amount 
      : (client.totalPayments || 0) + amount;

    try {
      await updateDoc(doc(db, "clients", clientId), {
        installments: newInstallments,
        totalPayments: newTotalPayments,
        balance: (client.totalInvoices || 0) - newTotalPayments
      });
      toast({ title: "تم تحديث حالة القسط بنجاح" });
    } catch (err) {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    }
  };

  const handleSendWhatsAppAll = () => {
    if (filteredData.length === 0) {
      toast({ title: "تنبيه", description: "لا توجد بيانات لإرسال تنبيهات لها حالياً.", variant: "destructive" });
      return;
    }

    // تجميع المشاريع حسب رقم الهاتف لفتح محادثة واحدة لكل شخص
    const aggregatedByPhone: Record<string, { clientName: string, projects: any[] }> = {};

    filteredData.forEach((project) => {
      // نختار الرقم الأساسي، وإذا لم يوجد نختار الإضافي
      const targetPhone = project.clientPhone || project.clientPhone2;
      if (!targetPhone) return;

      // تنظيف الرقم وإضافة كود مصر
      let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone;
      } else if (!cleanPhone.startsWith('2')) {
        cleanPhone = '20' + cleanPhone;
      }

      if (!aggregatedByPhone[cleanPhone]) {
        aggregatedByPhone[cleanPhone] = { clientName: project.clientName, projects: [] };
      }
      aggregatedByPhone[cleanPhone].projects.push(project);
    });

    let windowCount = 0;
    Object.entries(aggregatedByPhone).forEach(([phone, data]) => {
      windowCount++;

      let fullMessage = `*تنبيه متابعة مالية مجمعة - APP STORE* 🚀\n\n`;
      fullMessage += `مرحباً سيد/ة: *${data.clientName}*\n`;
      fullMessage += `نحيطكم علماً بموقف الأقساط المجدولة للمشاريع التالية:\n\n`;

      data.projects.forEach(p => {
        fullMessage += `📌 *مشروع: ${p.projectName}*\n`;
        p.installments.forEach((inst: any) => {
          const statusIcon = inst.status === 'paid' ? '✅' : inst.isOverdue ? '⚠️' : '⏳';
          const statusText = inst.status === 'paid' ? 'تم السداد' : inst.isOverdue ? 'متأخر' : 'قيد الانتظار';
          fullMessage += `- مبلغ: ${inst.amount.toLocaleString()} ج.م (تاريخ: ${inst.dueDate || '---'}) [${statusText} ${statusIcon}]\n`;
        });
        fullMessage += `\n`;
      });

      fullMessage += `يرجى التفضل بمراجعة الموقف المالي والسداد في المواعيد المقررة.\nشكراً لتعاونكم الدائم.`;

      // نستخدم Timeout بفاصل زمني كافي (1.5 ثانية) لضمان عدم حظر المتصفح للنوافذ
      setTimeout(() => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
        window.open(url, '_blank');
      }, windowCount * 1500);
    });

    toast({ 
      title: "WhatsApp Payment Reminder", 
      description: `يتم الآن فتح ${windowCount} محادثة (رسالة مجمعة لكل عميل).` 
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filterTitle = {
      all: 'الشاملة',
      paid: 'المحصلة (المسددة)',
      pending: 'المعلقة',
      overdue: 'المتأخرة ⚠️'
    }[currentFilter];

    const dateRangeText = (startDate || endDate) 
      ? `للفترة من ${startDate || 'بداية السجلات'} إلى ${endDate || 'اليوم'}`
      : 'لكافة التواريخ';

    const rows = filteredData.flatMap(p => 
      p.installments.map((inst: any) => `
        <tr style="${inst.isOverdue ? 'background-color: #fff1f2;' : ''}">
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${p.projectName}</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.clientName}</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; text-align: left;">${(inst.amount || 0).toLocaleString()} ج.م</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${inst.dueDate || '---'}</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: ${inst.status === 'paid' ? '#16a34a' : inst.isOverdue ? '#e11d48' : '#f59e0b'};">
            ${inst.status === 'paid' ? 'مدفوع' : inst.isOverdue ? 'متأخر ⚠️' : 'في الانتظار'}
          </td>
        </tr>
      `)
    ).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير الأقساط المفلتر - APP STORE</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; }
            h1 { text-align: center; font-size: 24px; font-weight: 900; border-bottom: 4px solid #1e293b; padding-bottom: 15px; margin-bottom: 10px; }
            .filter-info { text-align: center; margin-bottom: 30px; }
            .filter-badge { color: #64748b; font-weight: bold; font-size: 14px; }
            .date-badge { color: #3b82f6; font-weight: bold; font-size: 12px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; padding: 12px; border: 1px solid #e2e8f0; text-align: right; }
            td { font-size: 13px; border-bottom: 1px solid #f1f5f9; padding: 12px; }
            .summary { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
            .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>تقرير جدولة الأقساط ومتابعة التحصيل</h1>
          <div class="filter-info">
            <div class="filter-badge">نوع التقسيم: ${filterTitle}</div>
            <div class="date-badge">${dateRangeText}</div>
          </div>
          <p>تاريخ استخراج التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          <table>
            <thead>
              <tr>
                <th>المشروع</th>
                <th>اسم العميل</th>
                <th>المبلغ</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5" style="text-align:center; padding: 50px;">لا توجد بيانات تطابق الفلتر المختار</td></tr>'}
            </tbody>
          </table>
          <div class="summary">
            <span><b>إجمالي قيمة الأقساط في التقرير:</b> ${stats.total.toLocaleString()} ج.م</span>
            <span><b>تم تحصيل:</b> ${stats.paid.toLocaleString()} ج.م</span>
            <span><b>مبالغ معلقة:</b> ${stats.pending.toLocaleString()} ج.م</span>
          </div>
          <div class="footer">صادر عن نظام إدارة APP STORE للمقاولات البرمجية</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل جدول الأقساط المطور...</p>
    </div>
  );

  const resetFilters = () => {
    setCurrentFilter('all');
    setSearchQuery('');
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">جدولة ومتابعة الأقساط</h1>
            <p className="text-slate-500 font-bold">إدارة مبالغ التعاقد المجدولة والتحصيل بكل مشروع</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           {(currentFilter !== 'all' || searchQuery || startDate || endDate) && (
             <Button 
               variant="ghost" 
               onClick={resetFilters}
               className="rounded-xl h-12 font-black text-xs gap-2 text-rose-500 hover:bg-rose-50"
             >
               <FilterX className="h-4 w-4" /> إلغاء الفلاتر
             </Button>
           )}
           <Button 
             onClick={handleSendWhatsAppAll}
             className="rounded-2xl h-14 px-6 font-black text-lg gap-3 bg-green-500 hover:bg-green-600 text-white shadow-lg active:scale-95 transition-all"
           >
             <MessageCircle className="h-6 w-6" /> WhatsApp Payment Reminder
           </Button>
           <Button 
             onClick={handlePrint}
             variant="outline"
             className="rounded-2xl h-14 px-8 font-black text-lg gap-3 border-2 border-primary text-primary hover:bg-primary/5 transition-all shadow-sm"
           >
             <Printer className="h-6 w-6" /> طباعة التقرير
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الأقساط" 
          value={stats.total} 
          icon={<Wallet className="text-primary" />} 
          color="bg-primary/5" 
          active={currentFilter === 'all'}
          onClick={() => setCurrentFilter('all')}
        />
        <StatCard 
          title="تم تحصيله" 
          value={stats.paid} 
          icon={<CheckCircle2 className="text-green-500" />} 
          color="bg-green-50" 
          textColor="text-green-700" 
          active={currentFilter === 'paid'}
          onClick={() => setCurrentFilter('paid')}
        />
        <StatCard 
          title="مبالغ معلقة" 
          value={stats.pending} 
          icon={<Clock className="text-orange-500" />} 
          color="bg-orange-50" 
          textColor="text-orange-700" 
          active={currentFilter === 'pending'}
          onClick={() => setCurrentFilter('pending')}
        />
        <StatCard 
          title="أقساط متأخرة" 
          value={stats.overdueCount} 
          icon={<BellRing className={cn("text-rose-500", stats.overdueCount > 0 && "animate-bounce")} />} 
          color="bg-rose-50" 
          textColor="text-rose-700" 
          unit="قسط"
          active={currentFilter === 'overdue'}
          onClick={() => setCurrentFilter('overdue')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="lg:col-span-6 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1">بحث بالاسم أو الهاتف</Label>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="ابحث باسم المشروع، العميل، أو رقم الهاتف..." 
              className="pr-12 h-14 rounded-2xl font-bold text-base border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1 flex items-center gap-2">
            <CalendarIcon className="h-3 w-3 text-primary" /> من تاريخ
          </Label>
          <Input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50"
          />
        </div>

        <div className="lg:col-span-3 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1 flex items-center gap-2">
            <CalendarIcon className="h-3 w-3 text-primary" /> إلى تاريخ
          </Label>
          <Input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50"
          />
        </div>
      </div>

      <div className="space-y-10">
        {filteredData.map((project, pIdx) => (
          <div key={project.clientId + pIdx} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg">{pIdx + 1}</div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{project.projectName}</h2>
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    العميل: {project.clientName}
                    {project.hasOverdue && (
                      <Badge className="bg-rose-500 rounded-lg text-[8px] animate-pulse">يوجد تأخير</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-[300px]">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span>نسبة التحصيل في المشروع</span>
                    <span className="text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>
                <Badge variant="outline" className="rounded-xl h-9 px-4 font-black border-primary/20 text-primary bg-primary/5">
                  {project.paidAmount.toLocaleString()} / {project.totalAmount.toLocaleString()} ج.م
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {project.installments.map((inst: any, iIdx: number) => (
                <Card 
                  key={iIdx} 
                  onClick={() => toggleInstallmentStatus(project.clientId, iIdx)}
                  className={cn(
                    "rounded-[1.5rem] border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group overflow-hidden",
                    inst.status === 'paid' 
                      ? 'bg-green-50 border-green-200' 
                      : inst.isOverdue 
                        ? 'bg-rose-50 border-rose-200 animate-in fade-in' 
                        : 'bg-white border-slate-100 hover:border-primary/20'
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm transition-colors",
                        inst.isOverdue ? "text-rose-500 shadow-rose-100" : "text-slate-400 group-hover:text-primary"
                      )}>
                        {inst.isOverdue ? <AlertCircle className="h-5 w-5 animate-pulse" /> : <TrendingUp className="h-5 w-5" />}
                      </div>
                      <Badge className={cn(
                        "rounded-lg font-black text-[9px] px-2 h-5",
                        inst.status === 'paid' 
                          ? 'bg-green-500' 
                          : inst.isOverdue 
                            ? 'bg-rose-600' 
                            : 'bg-orange-500'
                      )}>
                        {inst.status === 'paid' ? 'مدفوع' : inst.isOverdue ? 'متأخر ⚠️' : 'في الانتظار'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className={cn(
                        "text-2xl font-black",
                        inst.isOverdue ? "text-rose-700" : "text-slate-800"
                      )}>
                        {(inst.amount || 0).toLocaleString('ar-EG')} <small className="text-[10px]">ج.م</small>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold text-[10px]",
                        inst.isOverdue ? "text-rose-400" : "text-slate-400"
                      )}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>الاستحقاق: {inst.dueDate || '---'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100/50 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span className={cn(inst.isOverdue && "text-rose-400")}>تغيير الحالة</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="py-24 text-center opacity-30 space-y-4 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <FilterX className="h-20 w-20 mx-auto text-slate-300" />
            <p className="text-2xl font-black uppercase tracking-widest text-slate-400">
              لا توجد نتائج تطابق الفلاتر المختارة
            </p>
            <Button variant="link" onClick={resetFilters} className="font-bold text-primary">إعادة تعيين كافة الفلاتر</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor = "text-slate-800", unit = "ج.م", active, onClick }: any) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "rounded-[2rem] border shadow-sm p-8 transition-all cursor-pointer hover:scale-105 active:scale-95 group",
        color,
        active ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-white/20"
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">{title}</span>
        <div className={cn(
          "p-3 rounded-xl shadow-sm transition-all",
          active ? "bg-primary text-white" : "bg-white"
        )}>
          {icon}
        </div>
      </div>
      <div className={cn(
        "text-3xl font-black transition-all",
        active ? "scale-110" : "",
        textColor
      )}>
        {value.toLocaleString('ar-EG')} <span className="text-sm font-bold opacity-60">{unit}</span>
      </div>
      {active && (
        <div className="mt-3 flex items-center gap-1.5 text-[8px] font-black text-primary uppercase">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          الفلتر مفعل حالياً
        </div>
      )}
    </Card>
  );
}

export default function InstallmentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <InstallmentsContent />
    </Suspense>
  );
}
