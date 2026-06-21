
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
import { TestingScheduleModal } from "@/components/modals/testing-schedule-modal";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ 
    clients: 0, 
    projects: 0, 
    finished: 0, 
  });
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    if (!db || authLoading) return;
    
    if (!profile) {
      setLoading(false);
      return;
    }

    let unsubscribers: Unsubscribe[] = [];

    if (profile.role === 'admin') {
      const unsubC = onSnapshot(collection(db, "clients"), (s) => setStats(p => ({ ...p, clients: s.size })));
      const unsubP = onSnapshot(collection(db, "projects"), (s) => {
        const docs = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: docs.filter(d => d.status !== 'مكتمل').length,
          finished: docs.filter(d => d.status === 'مكتمل').length
        }));
      });
      unsubscribers.push(unsubC, unsubP);
      setLoading(false);
    } 
    else if (profile.role === 'client' && profile.clientId) {
      const q = query(collection(db, "projects"), where("clientId", "==", profile.clientId));
      const unsubP = onSnapshot(q, (s) => {
        const myProjects = s.docs.map(d => d.data());
        setStats(p => ({ ...p, projects: myProjects.filter(p => p.status !== 'مكتمل').length, finished: myProjects.filter(p => p.status === 'مكتمل').length }));
        setLoading(false);
      }, () => setLoading(false));
      unsubscribers.push(unsubP);
    } else {
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [profile, authLoading]);

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500 text-xs">جاري التجهيز...</p>
    </div>
  );

  const isAdmin = profile?.role === 'admin';
  const isLinked = !!profile?.clientId;
  const canViewProjects = isAdmin || profile?.permissions.includes('p_projects');

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
        <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">نظرة عامة</h1>
                <p className="text-[10px] text-slate-500 font-bold">ملخص الأداء والحالة العامة للنظام</p>
              </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin ? (
            <>
              <StatCard title="إجمالي العملاء" icon={<Users className="text-primary h-4 w-4" />} value={stats.clients} onClick={() => router.push('/clients')} />
              <StatCard title="مشاريع نشطة" icon={<Briefcase className="text-orange-500 h-4 w-4" />} value={stats.projects} onClick={() => router.push('/projects')} />
              <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500 h-4 w-4" />} value={stats.finished} onClick={() => router.push('/projects')} />
              <StatCard 
                title="جدول الاختبارات" 
                icon={<CalendarDays className="text-indigo-500 h-4 w-4" />} 
                value="فتح" 
                onClick={() => setIsScheduleModalOpen(true)} 
              />
            </>
          ) : canViewProjects ? (
            <>
              <StatCard title={"مشاريعي الجارية"} icon={<Briefcase className="text-orange-500 h-4 w-4" />} value={stats.projects} onClick={() => router.push('/projects')} />
              <StatCard title={"مشاريع تم تسليمها"} icon={<CheckCircle className="text-green-500 h-4 w-4" />} value={stats.finished} onClick={() => router.push('/projects')} />
              <StatCard title={"حالة الربط"} icon={<ShieldCheck className={isLinked ? "text-green-500 h-4 w-4" : "text-rose-500 h-4 w-4"} />} value={isLinked ? "مفعل" : "معلق"} />
            </>
          ) : (
            <div className="lg:col-span-3 p-6 bg-slate-50 rounded-2xl border border-dashed flex items-center justify-center gap-3 text-slate-400">
              <Lock className="h-5 w-5" />
              <span className="font-black text-xs uppercase tracking-wider">الأقسام محجوبة حالياً</span>
            </div>
          )}
        </div>

        <Card className="rounded-3xl border-none shadow-md bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute -bottom-8 -left-8 opacity-10">
            <LayoutDashboard className="h-48 w-48 rotate-12" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-3">
              {isAdmin ? 'مركز التحكم والسيطرة' : 'متابعة شفافة لمشروعك'}
            </h2>
            <p className="opacity-80 font-bold max-w-2xl mx-auto text-sm leading-relaxed mb-6">
              {isAdmin 
                ? 'إدارة متكاملة لكل جوانب وكالتك الرقمية من العملاء والمشاريع وحتى المختبرين في مكان واحد.'
                : 'نمنحك رؤية كاملة لمراحل تنفيذ مشروعك لضمان تحقيق رؤيتك بأفضل شكل ممكن.'
              }
            </p>
            {isAdmin && (
              <Button onClick={() => router.push('/users')} size="sm" className="h-10 rounded-xl bg-white/90 hover:bg-white text-primary font-black text-xs px-6 shadow-md backdrop-blur-sm gap-2 transition-all">
                  إدارة الصلاحيات <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
      <TestingScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />
    </>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  return (
    <Card 
      className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white p-1 group"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <CardTitle className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{title}</CardTitle>
        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-2xl font-black text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}
