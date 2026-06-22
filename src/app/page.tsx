
'use client';
import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  LayoutDashboard, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  Lock,
  CalendarDays,
  ArrowLeft 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Unsubscribe } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TestingScheduleModal } from "@/components/modals/testing-schedule-modal";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0 });
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || authLoading || !profile) {
      if (!authLoading) setLoading(false);
      return;
    }

    let unsubscribers: Unsubscribe[] = [];

    if (profile.role === 'admin') {
      const unsubC = onSnapshot(collection(db, "clients"), (s) => setStats(p => ({ ...p, clients: s.size })), (e) => console.warn(e));
      const unsubP = onSnapshot(collection(db, "projects"), (s) => {
        const docs = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: docs.filter(d => d.status !== 'مكتمل').length,
          finished: docs.filter(d => d.status === 'مكتمل').length
        }));
      }, (e) => console.warn(e));
      unsubscribers.push(unsubC, unsubP);
      setLoading(false);
    } 
    else if (profile.role === 'client' && profile.clientId) {
      if (!profile.permissions.includes('p_projects')) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, "projects"), where("clientId", "==", profile.clientId));
      const unsubP = onSnapshot(q, (s) => {
        const myProjects = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: myProjects.filter(p => p.status !== 'مكتمل').length, 
          finished: myProjects.filter(p => p.status === 'مكتمل').length 
        }));
        setLoading(false);
      }, (e) => {
        console.warn("Home Project Access Denied:", e);
        setLoading(false);
      });
      unsubscribers.push(unsubP);
    } else {
      setLoading(false);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [profile, authLoading]);

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري التحميل...</p>
    </div>
  );

  const isAdmin = profile?.role === 'admin';
  const isLinked = !!profile?.clientId;
  const canViewProjects = isAdmin || profile?.permissions.includes('p_projects');

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isAdmin ? (
            <>
              <StatCard title="إجمالي العملاء" icon={<Users className="text-primary" />} value={stats.clients} onClick={() => router.push('/clients')} />
              <StatCard title="مشاريع نشطة" icon={<Briefcase className="text-orange-500" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />
              <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500" />} value={stats.finished} onClick={() => router.push('/projects?status=finished')} />
              <StatCard title="جدول الاختبارات" icon={<CalendarDays className="text-indigo-500" />} value="اليوم" onClick={() => setIsScheduleModalOpen(true)} />
            </>
          ) : canViewProjects ? (
            <>
              <StatCard title="مشاريعي الجارية" icon={<Briefcase className="text-orange-500" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />
              <StatCard title="مشاريع تم تسليمها" icon={<CheckCircle className="text-green-500" />} value={stats.finished} onClick={() => router.push('/projects?status=finished')} />
              <StatCard title="حالة الحساب" icon={<ShieldCheck className={isLinked ? "text-green-500" : "text-rose-500"} />} value={isLinked ? "مفعل" : "معلق"} />
            </>
          ) : (
            <div className="lg:col-span-3 p-6 bg-slate-50 rounded-[2rem] border border-dashed flex items-center justify-center gap-4 text-slate-400">
              <Lock className="h-6 w-6" />
              <span className="font-black text-sm uppercase tracking-wider">الوصول مقيد للمشرفين</span>
            </div>
          )}
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute -bottom-12 -left-12 opacity-10"><LayoutDashboard className="h-64 w-64 rotate-12" /></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4">{isAdmin ? 'مركز التحكم والسيطرة' : 'متابعة شفافة لمشروعك'}</h2>
            <p className="opacity-80 font-bold max-w-2xl mx-auto text-base leading-relaxed mb-8">
              {isAdmin 
                ? 'قم بإدارة كل جوانب وكالتك الرقمية، من العملاء والمشاريع، وصولاً إلى المختبرين وصلاحيات المستخدمين في مكان واحد.'
                : 'نمنحك رؤية كاملة لمشروعك. تابع مراحل التنفيذ، اطلع على الملاحظات، وتواصل معنا لضمان تحقيق رؤيتك.'}
            </p>
            {isAdmin && <Button onClick={() => router.push('/users')} size="lg" className="rounded-xl bg-white/90 text-primary font-black shadow-lg gap-2 hover:scale-105">إدارة الصلاحيات <ArrowLeft className="h-5 w-5" /></Button>}
          </div>
        </Card>
      </div>
      <TestingScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />
    </>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  return (
    <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white p-2 group" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase">{title}</CardTitle>
        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      </CardHeader>
      <CardContent><div className="text-3xl font-black text-slate-800">{value}</div></CardContent>
    </Card>
  );
}
