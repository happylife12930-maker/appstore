"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Users, Briefcase, CheckCircle, LayoutDashboard, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, or } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || authLoading || !profile) return;

    if (profile.role === 'admin') {
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
    } 
    else if (profile.role === 'client') {
      // استخدام Query بـ OR لضمان جلب المشاريع المسموح بها فقط وتجنب خطأ Permission Denied
      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        or(
          where("clientId", "==", profile.clientId || "NONE"),
          where("clientEmail", "==", profile.email || "NONE"),
          where("clientPhone", "==", profile.phone || "NONE")
        )
      );

      const unsubP = onSnapshot(q, (s) => {
        const myProjects = s.docs;
        setStats({
          clients: 0,
          projects: myProjects.filter(p => p.data().status !== 'مكتمل').length,
          finished: myProjects.filter(p => p.data().status === 'مكتمل').length
        });
        setLoading(false);
      }, (error) => {
        console.error("Dashboard Snapshot Error:", error);
        setLoading(false);
      });
      return () => unsubP();
    } else {
      setLoading(false);
    }
  }, [profile, authLoading]);

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تجهيز لوحة التحكم...</p>
    </div>
  );

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
      <header className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800">
            {isAdmin ? 'نظرة عامة' : 'بوابة المستفيد'}
          </h1>
          <p className="text-slate-500 font-bold">
            {isAdmin ? 'مرحباً بك في نظام APP STORE الإداري' : `مرحباً بك يا ${profile?.name || 'عميلنا العزيز'}`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <StatCard 
            title="إجمالي العملاء" 
            icon={<Users className="text-primary" />} 
            value={stats.clients} 
            onClick={() => router.push('/clients')} 
          />
        )}
        
        <StatCard 
          title={isAdmin ? "مشاريع نشطة" : "مشاريعي الجارية"} 
          icon={<Briefcase className="text-orange-500" />} 
          value={stats.projects} 
          onClick={() => router.push('/projects')} 
        />
        
        <StatCard 
          title={isAdmin ? "مشاريع منتهية" : "مشاريع تم تسليمها"} 
          icon={<CheckCircle className="text-green-500" />} 
          value={stats.finished} 
          onClick={() => router.push('/projects')} 
        />
        
        {isAdmin ? (
          <StatCard 
            title="الصلاحيات" 
            icon={<ShieldCheck className="text-rose-500" />} 
            value="إدارة" 
            onClick={() => router.push('/users')} 
          />
        ) : (
          <StatCard 
            title="آخر تحديث" 
            icon={<Clock className="text-blue-500" />} 
            value="الآن" 
            onClick={() => router.push('/projects')} 
          />
        )}
      </div>
      
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-12 text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Briefcase className="h-64 w-64 rotate-12" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-4">
            {isAdmin ? 'نظام إدارة الوكالة المتكامل' : 'متابعة شفافة لمشروعك'}
          </h2>
          <p className="opacity-80 font-bold max-w-2xl mx-auto text-lg leading-relaxed">
            {isAdmin 
              ? 'يمكنك الآن إدارة عملائك، مراقبة مراحل تنفيذ مشاريعك لحظة بلحظة، وتحديد صلاحيات الدخول لكل عميل بكل سهولة من مكان واحد.'
              : 'يمكنك من هنا متابعة مراحل تنفيذ مشروعك لحظة بلحظة، الاطلاع على المتطلبات، والتواصل مع فريق العمل لضمان أفضل جودة.'
            }
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
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</CardTitle>
        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}