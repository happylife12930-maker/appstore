
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
  Filter,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function InstallmentsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  // استخراج المشاريع التي لها أقساط
  const projectsWithInstallments = useMemo(() => {
    return clients
      .filter(c => c.paymentType === 'installments' && c.installments?.length > 0)
      .map(c => {
        const totalAmount = c.installments.reduce((acc: number, inst: any) => acc + (inst.amount || 0), 0);
        const paidAmount = c.installments.filter((inst: any) => inst.status === 'paid').reduce((acc: number, inst: any) => acc + (inst.amount || 0), 0);
        const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
        
        return {
          clientId: c.id,
          clientName: c.name,
          projectName: c.projectName || "مشروع بدون اسم",
          installments: c.installments,
          progress,
          paidAmount,
          totalAmount
        };
      });
  }, [clients]);

  const filteredData = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return projectsWithInstallments.filter(p => 
      p.projectName.toLowerCase().includes(s) || 
      p.clientName.toLowerCase().includes(s)
    );
  }, [projectsWithInstallments, searchQuery]);

  const toggleInstallmentStatus = async (clientId: string, instIndex: number) => {
    if (!db) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newInstallments = [...client.installments];
    const currentStatus = newInstallments[instIndex].status;
    newInstallments[instIndex].status = currentStatus === 'paid' ? 'pending' : 'paid';

    // تحديث إجمالي المدفوعات في ملف العميل ليعكس التغيير
    const amount = newInstallments[instIndex].amount || 0;
    const newTotalPayments = currentStatus === 'paid' 
      ? (client.totalPayments || 0) - amount 
      : (client.totalPayments || 0) + amount;

    try {
      await updateDoc(doc(db, "clients", clientId), {
        installments: newInstallments,
        totalPayments: newTotalPayments,
        balance: (client.totalInvoices || 0) - newTotalPayments
      });
      toast({ title: "تم التحديث بنجاح" });
    } catch (err) {
      toast({ title: "خطأ في التحديث", variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let paid = 0;
    projectsWithInstallments.forEach(p => {
      p.installments.forEach((inst: any) => {
        if (inst.status === 'paid') paid += inst.amount;
        else pending += inst.amount;
        total += inst.amount;
      });
    });
    return { total, pending, paid };
  }, [projectsWithInstallments]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-black text-slate-500">جاري تحميل جدول الأقساط...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">جدولة ومتابعة الأقساط</h1>
            <p className="text-slate-500 font-bold">إدارة مبالغ التعاقد المجدولة والتحصيل لكل مشروع</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي الأقساط" value={stats.total} icon={<Wallet className="text-primary" />} color="bg-primary/5" />
        <StatCard title="تم تحصيله" value={stats.paid} icon={<CheckCircle2 className="text-green-500" />} color="bg-green-50" textColor="text-green-700" />
        <StatCard title="مبالغ معلقة" value={stats.pending} icon={<Clock className="text-orange-500" />} color="bg-orange-50" textColor="text-orange-700" />
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="بحث باسم المشروع أو العميل..." 
          className="pr-12 h-14 rounded-2xl font-bold text-base border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-10">
        {filteredData.map((project, pIdx) => (
          <div key={project.clientId} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">{pIdx + 1}</div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{project.projectName}</h2>
                  <p className="text-xs font-bold text-slate-400">العميل: {project.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-[250px]">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span>نسبة التحصيل</span>
                    <span className="text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>
                <Badge variant="outline" className="rounded-xl h-8 px-4 font-black border-primary/20 text-primary bg-primary/5">
                  {project.paidAmount.toLocaleString()} / {project.totalAmount.toLocaleString()} ج.م
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {project.installments.map((inst: any, iIdx: number) => (
                <Card 
                  key={iIdx} 
                  onClick={() => toggleInstallmentStatus(project.clientId, iIdx)}
                  className={`rounded-[1.5rem] border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group overflow-hidden ${
                    inst.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:border-primary/20'
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-primary transition-colors">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <Badge className={`rounded-lg font-black text-[9px] px-2 h-5 ${
                        inst.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {inst.status === 'paid' ? 'مدفوع' : 'في الانتظار'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-2xl font-black text-slate-800">{(inst.amount || 0).toLocaleString('ar-EG')} <small className="text-[10px]">ج.م</small></p>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        <span className="text-[10px] font-bold">تاريخ الاستحقاق: {inst.dueDate || '---'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100/50 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>اضغط لتغيير الحالة</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="py-20 text-center opacity-30 space-y-4">
            <AlertCircle className="h-20 w-20 mx-auto" />
            <p className="text-2xl font-black">لا توجد أقساط مجدولة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor = "text-slate-800" }: any) {
  return (
    <Card className={`rounded-[2rem] border-none shadow-sm p-8 ${color}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">{title}</span>
        <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
      </div>
      <div className={`text-3xl font-black ${textColor}`}>{value.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></div>
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
