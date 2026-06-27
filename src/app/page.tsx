
'use client';
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  LayoutDashboard, 
  ShieldCheck, 
  Loader2, 
  CalendarDays,
  ArrowLeft,
  LifeBuoy,
  ShieldAlert,
  MessageSquare,
  Camera,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Unsubscribe, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { TestingScheduleModal } from "@/components/modals/testing-schedule-modal";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import imagesData from "@/app/lib/placeholder-images.json";

const defaultLogo = imagesData.placeholderImages.find(img => img.id === 'agency-logo');

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0, unreadSupport: 0 });
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [agencyLogo, setAgencyLogo] = useState(defaultLogo?.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!db) return;
    
    // مراقبة الشعار من قاعدة البيانات
    const unsubLogo = onSnapshot(doc(db, "settings", "agency"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoUrl) {
        setAgencyLogo(docSnap.data().logoUrl);
      }
    });

    if (authLoading || !profile) {
      if (!authLoading) setLoading(false);
      return () => unsubLogo();
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
      const unsubS = onSnapshot(collection(db, "support_threads"), (s) => {
        const totalUnread = s.docs.reduce((acc, d) => acc + (d.data().unreadAdmin || 0), 0);
        setStats(p => ({ ...p, unreadSupport: totalUnread }));
      });
      unsubscribers.push(unsubC, unsubP, unsubS);
      setLoading(false);
    } 
    else if (profile.role === 'client' && profile.clientId) {
      const q = query(collection(db, "projects"), where("clientId", "==", profile.clientId));
      const unsubP = onSnapshot(q, (s) => {
        const myProjects = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: myProjects.filter(p => p.status !== 'مكتمل').length, 
          finished: myProjects.filter(p => p.status === 'مكتمل').length 
        }));
      });
      const unsubS = onSnapshot(doc(db, "support_threads", profile.clientId), (docSnap) => {
        if (docSnap.exists()) {
          setStats(p => ({ ...p, unreadSupport: docSnap.data().unreadClient || 0 }));
        }
      });
      unsubscribers.push(unsubP, unsubS);
      setLoading(false);
    } else {
      setLoading(false);
    }

    return () => {
      unsubLogo();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [profile, authLoading]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploading(true);
    const IMGBB_API_KEY = '182b7fc61cf92fcbd3094ed2dce7cd27';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data.url) {
        const newUrl = result.data.url;
        await setDoc(doc(db!, "settings", "agency"), { logoUrl: newUrl }, { merge: true });
        setAgencyLogo(newUrl);
        toast({ title: "تم تحديث الشعار", description: "تم تغيير هوية الوكالة بنجاح في كافة أقسام النظام." });
      }
    } catch (error) {
      toast({ title: "خطأ في الرفع", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">جاري التحميل...</p>
    </div>
  );

  const isLinked = !!profile?.clientId;

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[1.5rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="relative h-14 w-14 transition-all hover:scale-105 overflow-hidden rounded-xl border border-slate-100 shadow-inner">
              <Image 
                src={agencyLogo} 
                alt="Logo" 
                fill 
                unoptimized
                className="object-contain p-1"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -left-1 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-slate-800 transition-colors"
              >
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">لوحة التحكم</h1>
            <p className="text-[10px] text-slate-500 font-bold">مرحباً {profile?.name}، تابع آخر التطورات</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsScheduleModalOpen(true)} className="rounded-xl h-11 px-6 font-black text-sm gap-2 shadow-md hover:scale-105 transition-all">
            <CalendarDays className="h-5 w-5" /> جدول الاختبارات الأسبوعي
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isAdmin ? (
          <>
            <StatCard title="إجمالي العملاء" icon={<Users className="text-primary h-5 w-5" />} value={stats.clients} onClick={() => router.push('/clients')} />
            <StatCard title="مشاريع نشطة" icon={<Briefcase className="text-orange-500 h-5 w-5" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />
            <StatCard title="رسايل الدعم" icon={<MessageSquare className={(stats.unreadSupport > 0 ? "text-rose-500 animate-pulse" : "text-indigo-500") + " h-5 w-5"} />} value={stats.unreadSupport > 0 ? `${stats.unreadSupport} غير مقروءة` : "لا توجد"} onClick={() => router.push('/support')} />
            <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500 h-5 w-5" />} value={stats.finished} onClick={() => router.push('/projects?status=finished')} />
            <StatCard title="بوابة المستخدمين" icon={<ShieldAlert className="text-rose-500 h-5 w-5" />} value="إدارة" onClick={() => router.push('/users')} />
          </>
        ) : (
          <>
            <StatCard title="مشاريع جارية" icon={<Briefcase className="text-orange-500 h-5 w-5" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />
            <StatCard title="مشاريع منتهية" icon={<CheckCircle className="text-green-500 h-5 w-5" />} value={stats.finished} onClick={() => router.push('/projects?status=finished')} />
            <StatCard title="الدعم الفني" icon={<LifeBuoy className={(stats.unreadSupport > 0 ? "text-rose-500 animate-pulse" : "text-indigo-500") + " h-5 w-5"} />} value={stats.unreadSupport > 0 ? `${stats.unreadSupport} رسالة` : "مراسلة"} onClick={() => router.push('/support')} />
            <StatCard title="حالة الحساب" icon={<ShieldCheck className={(isLinked ? "text-green-500" : "text-rose-500") + " h-5 w-5"} />} value={isLinked ? "نشط" : "معلق"} onClick={() => router.push('/profile')} />
          </>
        )}
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-12 text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Image src={agencyLogo} alt="Watermark" width={300} height={300} unoptimized className="object-contain" />
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black">{isAdmin ? 'مركز الإدارة المتكامل' : 'رؤية شفافة لمشروعك'}</h2>
          <p className="opacity-80 font-bold max-w-2xl mx-auto text-sm leading-relaxed">
            {isAdmin 
              ? 'أهلاً بك في المحرك الرئيسي لوكالة APP STORE؛ حيث تلتقي الحلول الرقمية مع النمو الذي لا حدود له. تحكم في كافة جوانب الوكالة من مكان واحد.'
              : 'شريكنا العزيز، نحن هنا لنحول أفكارك إلى واقع رقمي ملموس. تابع مراحل تنفيذ طلباتك لحظة بلحظة لضمان الحصول على أفضل النتائج.'}
          </p>
          <div className="flex justify-center gap-4">
             <Button onClick={() => router.push(isAdmin ? '/projects' : '/support')} size="lg" className="rounded-2xl bg-white text-primary font-black shadow-2xl gap-3 h-14 px-10 hover:bg-slate-50 text-base">
               {isAdmin ? 'ابدأ العمل اليوم' : 'اطلب دعم فني'} <ArrowLeft className="h-5 w-5" />
             </Button>
          </div>
        </div>
      </Card>

      <TestingScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />
    </div>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  return (
    <Card className="rounded-[1.2rem] border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white p-2 group" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</CardTitle>
        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">{icon}</div>
      </CardHeader>
      <CardContent><div className="text-sm font-black text-slate-800">{value}</div></CardContent>
    </Card>
  );
}
