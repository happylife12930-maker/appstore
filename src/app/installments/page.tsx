
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CalendarDays, Search, CheckCircle2, Clock, AlertCircle, Loader2, Wallet, TrendingUp, Printer, BellRing, FilterX, Calendar as CalendarIcon, MessageCircle, Send, Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/language-provider";

type FilterType = 'all' | 'paid' | 'pending' | 'overdue';

interface WhatsAppQueueItem {
  phone: string;
  clientName: string;
  message: string;
}

function InstallmentsContent() {
  const { t, dir, language } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappQueue, setWhatsappQueue] = useState<WhatsAppQueueItem[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin';
  const hasFinancePermission = isAdmin && (profile?.permissions || []).includes('p_finances');

  useEffect(() => {
    if (authLoading) return;
    if (!hasFinancePermission) {
      setLoading(false);
      return;
    }
    if (!db) return;

    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [hasFinancePermission, authLoading]);

  const projectsWithInstallments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients
      .filter(c => c.paymentType === 'installments' && c.installments?.length > 0)
      .map(c => {
        const installments = (c.installments || []).map((inst: any) => {
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
          projectName: c.projectName || (language === 'ar' ? "مشروع بدون اسم" : "Unnamed Project"),
          installments,
          progress,
          paidAmount,
          totalAmount,
          hasOverdue: installments.some((i: any) => i.isOverdue)
        };
      });
  }, [clients, language]);

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
        const matchesSearch = p.projectName.toLowerCase().includes(s) || p.clientName.toLowerCase().includes(s) || (p.clientPhone && String(p.clientPhone).includes(searchQuery));
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
        if (inst.status === 'paid') paid += (inst.amount || 0);
        else {
          pending += (inst.amount || 0);
          if (inst.isOverdue) overdueCount++;
        }
        total += (inst.amount || 0);
      });
    });
    return { total, pending, paid, overdueCount };
  }, [filteredData]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body onload="window.print()"><pre>${JSON.stringify(filteredData, null, 2)}</pre></body></html>`);
    printWindow.document.close();
  };

  if (authLoading || loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  if (!hasFinancePermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-slate-200" />
        <h2 className="text-xl font-black text-slate-800">{t('access_restricted')}</h2>
        <Button onClick={() => router.push("/")} className="mt-4 rounded-xl h-10 px-6 font-black">{t('back')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary"><CalendarDays className="h-8 w-8" /></div>
          <div><h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('installments_title')}</h1><p className="text-slate-500 font-bold">{t('installments_subtitle')}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <Button onClick={() => setIsWhatsappModalOpen(true)} className="rounded-2xl h-14 px-6 font-black text-lg gap-3 bg-green-500 hover:bg-green-600 text-white shadow-lg"><MessageCircle className="h-6 w-6" /> {t('whatsapp_reminders')}</Button>
           <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-8 font-black text-lg gap-3 border-2 border-primary text-primary"><Printer className="h-6 w-6" /> {t('print_report')}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title={t('total_installments')} value={stats.total} icon={<Wallet className="text-primary" />} color="bg-primary/5" unit={language === 'ar' ? 'ج.م' : 'EGP'} />
        <StatCard title={t('collected')} value={stats.paid} icon={<CheckCircle2 className="text-green-500" />} color="bg-green-50" unit={language === 'ar' ? 'ج.م' : 'EGP'} />
        <StatCard title={t('pending_amounts')} value={stats.pending} icon={<Clock className="text-orange-500" />} color="bg-orange-50" unit={language === 'ar' ? 'ج.م' : 'EGP'} />
        <StatCard title={t('overdue_installments')} value={stats.overdueCount} icon={<BellRing className={cn("text-rose-500", stats.overdueCount > 0 && "animate-bounce")} />} color="bg-rose-50" unit={language === 'ar' ? 'قسط' : 'Inst.'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="lg:col-span-6 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1">{t('search_installments')}</Label>
          <div className="relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5`} />
            <Input placeholder={t('search')} className={`${dir === 'rtl' ? 'pr-12' : 'pl-12'} h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1 flex items-center gap-2"><CalendarIcon className="h-3 w-3 text-primary" /> {t('from_date')}</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-14 rounded-2xl font-bold border-slate-100" />
        </div>
        <div className="lg:col-span-3 space-y-2">
          <Label className="font-black text-xs text-slate-500 pr-1 flex items-center gap-2"><CalendarIcon className="h-3 w-3 text-primary" /> {t('to_date')}</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-14 rounded-2xl font-bold border-slate-100" />
        </div>
      </div>

      <div className="space-y-10">
        {filteredData.map((project, pIdx) => (
          <div key={project.clientId + pIdx} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg">{pIdx + 1}</div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black text-slate-800">{project.projectName}</h2>
                  <div className="text-xs font-bold text-slate-400">{t('client_name')}: {project.clientName}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-[300px]">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase"><span>{t('collection_ratio')}</span><span className="text-primary">{project.progress}%</span></div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>
                <Badge variant="outline" className="rounded-xl h-9 px-4 font-black bg-primary/5">{project.paidAmount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'} {t('paid')}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {project.installments.map((inst: any, iIdx: number) => (
                <Card 
                  key={iIdx} 
                  className={cn(
                    "rounded-[1.5rem] border-2 shadow-sm",
                    inst.status === 'paid' ? 'bg-green-50 border-green-200' : inst.isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={cn("h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm", inst.isOverdue ? "text-rose-500" : "text-slate-400")}>
                        {inst.isOverdue ? <AlertCircle className="h-5 w-5 animate-pulse" /> : <TrendingUp className="h-5 w-5" />}
                      </div>
                      <Badge className={cn("rounded-lg font-black text-[9px] px-2 h-5", inst.status === 'paid' ? 'bg-green-500' : inst.isOverdue ? 'bg-rose-600' : 'bg-orange-500')}>
                        {inst.status === 'paid' ? t('paid') : inst.isOverdue ? t('overdue') : t('status_pending')}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-slate-800">{(inst.amount || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <small className="text-[10px]">{language === 'ar' ? 'ج.م' : 'EGP'}</small></div>
                      <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" /> <span>{t('due_date')}: {inst.dueDate || '---'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, unit, active, onClick }: any) {
  const { language } = useTranslation();
  return (
    <Card onClick={onClick} className={cn("rounded-[2rem] border shadow-sm p-8 transition-all cursor-pointer hover:scale-105", color, active ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-white/20")}>
      <div className="flex justify-between items-center mb-4">
        <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">{title}</span>
        <div className={cn("p-3 rounded-xl shadow-sm transition-all", active ? "bg-primary text-white" : "bg-white")}>{icon}</div>
      </div>
      <div className="text-3xl font-black">{value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <span className="text-sm font-bold opacity-60">{unit}</span></div>
    </Card>
  );
}

export default function InstallmentsPage() { return <Suspense fallback={<Loader2 className="animate-spin" />}><InstallmentsContent /></Suspense>; }
