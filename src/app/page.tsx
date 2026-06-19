
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Users, Briefcase, CheckCircle, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const unsubC = onSnapshot(collection(db, "clients"), (s) => setStats(p => ({ ...p, clients: s.size })));
    const unsubP = onSnapshot(collection(db, "projects"), (s) => {
      setStats(p => ({ 
        ...p, 
        projects: s.docs.filter(d => d.data().status !== 'مكتمل').length,
        finished: s.docs.filter(d => d.data().status === 'مكتمل').length
      }));
      setLoading(false);
    });
    return () => { unsubC(); unsubP(); };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
      <header>
        <h1 className="text-4xl font-black text-slate-800">لوحة التحكم</h1>
        <p className="text-slate-500 font-bold">مرحباً بك في نظام APP STORE الإداري</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي العملاء" icon={<Users className="text-primary" />} value={stats.clients} onClick={() => router.push('/clients')} />
        <StatCard title="مشاريع نشطة" icon={<Briefcase className="text-orange-500" />} value={stats.projects} onClick={() => router.push('/projects')} />
        <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500" />} value={stats.finished} />
        <StatCard title="الإيرادات" icon={<DollarSign className="text-blue-500" />} value="جاري الحساب" />
      </div>
      
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-10 text-primary-foreground text-center">
        <h2 className="text-2xl font-black mb-4">نظام إدارة الوكالة المتكامل</h2>
        <p className="opacity-80 font-bold max-w-2xl mx-auto">يمكنك الآن إدارة عملائك، مراقبة مشاريعك، وتحديد صلاحيات الدخول لكل عميل بكل سهولة من مكان واحد.</p>
      </Card>
    </div>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  return (
    <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black text-slate-400">{title}</CardTitle>
        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}
