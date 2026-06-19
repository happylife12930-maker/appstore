
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Users, Briefcase, CheckCircle, DollarSign, LayoutDashboard, ShieldCheck } from "lucide-react";
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
      <header className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800">نظرة عامة</h1>
          <p className="text-slate-500 font-bold">مرحباً بك في نظام APP STORE الإداري</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي العملاء" icon={<Users className="text-primary" />} value={stats.clients} onClick={() => router.push('/clients')} />
        <StatCard title="مشاريع نشطة" icon={<Briefcase className="text-orange-500" />} value={stats.projects} onClick={() => router.push('/projects')} />
        <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500" />} value={stats.finished} onClick={() => router.push('/projects')} />
        <StatCard title="الصلاحيات" icon={<ShieldCheck className="text-rose-500" />} value="إدارة" onClick={() => router.push('/users')} />
      </div>
      
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-12 text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Briefcase className="h-64 w-64 rotate-12" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-4">نظام إدارة الوكالة المتكامل</h2>
          <p className="opacity-80 font-bold max-w-2xl mx-auto text-lg leading-relaxed">
            يمكنك الآن إدارة عملائك، مراقبة مراحل تنفيذ مشاريعك لحظة بلحظة، وتحديد صلاحيات الدخول لكل عميل بكل سهولة من مكان واحد وبأعلى معايير الأمان والخصوصية.
          </p>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  return (
    <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white p-2" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-wider">{title}</CardTitle>
        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}
