
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Users, Briefcase, CheckCircle, LayoutDashboard, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Unsubscribe, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0 });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || authLoading) return;
    
    if (!profile) {
      setLoading(false);
      return;
    }

    let unsubP: Unsubscribe = () => {};
    let unsubC: Unsubscribe = () => {};

    if (profile.role === 'admin') {
      unsubC = onSnapshot(collection(db, "clients"), (s) => setStats(p => ({ ...p, clients: s.size })));
      unsubP = onSnapshot(collection(db, "projects"), (s) => {
        const docs = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: docs.filter(d => d.status !== 'مكتمل').length,
          finished: docs.filter(d => d.status === 'مكتمل').length
        }));
        setLoading(false);
      }, () => setLoading(false));
    } 
    else if (profile.role === 'client' && profile.clientId) {
      const q = query(
        collection(db, "projects"),
        where("clientId", "==", profile.clientId)
      );

      unsubP = onSnapshot(q, (s) => {
        const myProjects = s.docs.map(d => d.data());
        setStats({
          clients: 0,
          projects: myProjects.filter(p => p.status !== 'مكتمل').length,
          finished: myProjects.filter(p => p.status === 'مكتمل').length
        });
        setLoading(false);
      }, (error) => {
        console.error("Dashboard Stats Error:", error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubP();
      unsubC();
    };
  }, [profile, authLoading]);

  // دالة لمزامنة الربط إذا كان معلقاً
  const handleSyncLink = async () => {
    if (!profile || !db) return;
    setIsSyncing(true);
    try {
      const emailLower = profile.email.toLowerCase().trim();
      const provisionDocRef = doc(db, "users_provision", emailLower);
      const provisionSnap = await getDoc(provisionDocRef);

      if (provisionSnap.exists()) {
        const pData = provisionSnap.data();
        await setDoc(doc(db, "users", profile.uid), {
          clientId: pData.clientId,
          status: "active"
        }, { merge: true });
        
        await deleteDoc(provisionDocRef);
        toast({ title: "تم التفعيل", description: "تم ربط حسابك بالمشاريع بنجاح." });
      } else {
        toast({ title: "تنبيه", description: "لم يتم العثور على تفعيل جديد. تأكد من قيام الإدارة بتنشيط حسابك.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ", description: "فشلت المزامنة، يرجى المحاولة لاحقاً.", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تجهيز لوحة التحكم...</p>
    </div>
  );

  const isAdmin = profile?.role === 'admin';
  const isLinked = !!profile?.clientId;

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
        </div>
        {!isAdmin && !isLinked && (
          <Button 
            onClick={handleSyncLink} 
            disabled={isSyncing}
            className="rounded-2xl h-14 px-8 font-black bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-xl animate-pulse"
          >
            {isSyncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            تحديث حالة الربط الآن
          </Button>
        )}
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
            title="حالة الربط" 
            icon={<ShieldCheck className={isLinked ? "text-green-500" : "text-rose-500"} />} 
            value={isLinked ? "مفعل" : "معلق"} 
            onClick={() => {}} 
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
