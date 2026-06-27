
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CreditCard, Search, Loader2, ArrowUpDown, FileText, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

function PaymentsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAdmin = profile?.role === 'admin';
  const hasFinancePermission = isAdmin || (profile?.permissions || []).includes('p_finances');

  useEffect(() => {
    if (!db || authLoading || !profile || !hasFinancePermission) {
      if (!authLoading) setLoading(false);
      return;
    }

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubClients(); unsubProjects(); };
  }, [profile, authLoading, hasFinancePermission]);

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">جاري تحميل البيانات المالية...</p>
    </div>
  );

  if (!hasFinancePermission) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">صلاحية مالية محدودة</h2>
          <p className="text-slate-500 font-bold text-sm">ليس لديك صلاحية الوصول للبيانات المالية حالياً. يرجى مراجعة الإدارة.</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const filteredData = clients.map(client => {
    const remainingBalance = (client.totalInvoices || 0) - (client.totalPayments || 0);
    return { ...client, remainingBalance };
  }).filter(item => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = item.name?.toLowerCase().includes(s) || item.phone?.includes(s);
    const matchesUnpaid = showOnlyUnpaid ? item.remainingBalance > 0 : true;
    return matchesSearch && matchesUnpaid;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><CreditCard className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">إدارة المدفوعات والمالية</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">متابعة الموقف المالي للعملاء</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input placeholder="ابحث بالاسم أو الهاتف..." className="pr-12 h-12 rounded-xl font-bold bg-white text-xs border-none shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 bg-white p-3 px-5 rounded-xl border shadow-sm h-12">
          <Switch id="unpaid" checked={showOnlyUnpaid} onCheckedChange={setShowOnlyUnpaid} />
          <Label htmlFor="unpaid" className="font-black text-[11px] cursor-pointer whitespace-nowrap">المديونيات فقط</Label>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white border">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="text-right font-black py-4">العميل</TableHead>
              <TableHead className="text-right font-black">إجمالي المطلوب</TableHead>
              <TableHead className="text-right font-black">المسدد</TableHead>
              <TableHead className="text-right font-black">المتبقي</TableHead>
              <TableHead className="text-center font-black">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold py-4">{item.name}</TableCell>
                <TableCell className="text-xs font-bold">{(item.totalInvoices || 0).toLocaleString('ar-EG')} ج.م</TableCell>
                <TableCell className="text-xs font-bold text-green-600">{(item.totalPayments || 0).toLocaleString('ar-EG')} ج.م</TableCell>
                <TableCell className={`font-black text-sm ${item.remainingBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {item.remainingBalance.toLocaleString('ar-EG')} ج.م
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg font-black text-[10px] gap-1 text-primary">
                    <FileText className="h-3 w-3" /> كشف حساب
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function PaymentsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}><PaymentsContent /></Suspense>;
}
