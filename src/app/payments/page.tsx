"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CreditCard, 
  Search, 
  Loader2,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push("/");
      return;
    }
    if (!db) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubClients(); unsubProjects(); };
  }, [profile, router]);

  const filteredData = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      return {
        ...client,
        projectsCount: clientProjects.length,
        remainingBalance: (client.totalInvoices || 0) - (client.totalPayments || 0)
      };
    }).filter(item => {
      const s = searchQuery.toLowerCase();
      const matchesSearch = item.name?.toLowerCase().includes(s) || item.phone?.includes(s);
      const matchesUnpaid = showOnlyUnpaid ? item.remainingBalance > 0 : true;
      return matchesSearch && matchesUnpaid;
    });
  }, [clients, projects, searchQuery, showOnlyUnpaid]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><CreditCard className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">البيانات المالية</h1>
            <p className="text-[10px] text-slate-500 font-bold">متابعة المديونيات والتحصيلات</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input placeholder="ابحث بالاسم أو الهاتف..." className="pr-12 h-12 rounded-xl font-bold bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-xl border">
          <Switch id="unpaid" checked={showOnlyUnpaid} onCheckedChange={setShowOnlyUnpaid} />
          <Label htmlFor="unpaid" className="font-bold text-xs">المديونيات فقط</Label>
        </div>
      </div>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-right font-black">العميل</TableHead>
              <TableHead className="text-right font-black">المطلوب</TableHead>
              <TableHead className="text-right font-black">المسدد</TableHead>
              <TableHead className="text-right font-black">المتبقي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold">{item.name}</TableCell>
                <TableCell>{(item.totalInvoices || 0).toLocaleString()} ج.م</TableCell>
                <TableCell className="text-green-600">{(item.totalPayments || 0).toLocaleString()} ج.م</TableCell>
                <TableCell className={`font-black ${item.remainingBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {item.remainingBalance.toLocaleString()} ج.م
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
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><PaymentsContent /></Suspense>;
}
