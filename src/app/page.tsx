
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
  ArrowRight,
  LifeBuoy,
  ShieldAlert,
  MessageSquare,
  Camera,
  Upload,
  Info,
  CheckCircle2,
  Facebook,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Unsubscribe, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { TestingScheduleModal } from "@/components/modals/testing-schedule-modal";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";
import Image from "next/image";
import imagesData from "@/app/lib/placeholder-images.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const defaultLogo = imagesData.placeholderImages.find(img => img.id === 'agency-logo');

export default function DashboardPage() {
  const { t, dir, language } = useTranslation();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ clients: 0, projects: 0, finished: 0, unreadSupport: 0 });
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [agencyLogo, setAgencyLogo] = useState(defaultLogo?.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [aboutUs, setAboutUs] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin';
  const perms = profile?.permissions || [];

  useEffect(() => {
    if (!db) return;
    
    const unsubAgency = onSnapshot(doc(db, "settings", "agency"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setAgencyLogo(data.logoUrl);
        if (data.aboutUs) setAboutUs(data.aboutUs);
        if (data.facebookUrl) setFacebookUrl(data.facebookUrl);
      }
    });

    if (authLoading || !profile) {
      if (!authLoading) setLoading(false);
      return () => unsubAgency();
    }

    let unsubscribers: Unsubscribe[] = [];

    if (profile.role === 'admin') {
      const unsubC = onSnapshot(collection(db, "clients"), (s) => setStats(p => ({ ...p, clients: s.size })));
      const unsubP = onSnapshot(collection(db, "projects"), (s) => {
        const docs = s.docs.map(d => d.data());
        setStats(p => ({ 
          ...p, 
          projects: docs.filter(d => d.status !== 'مكتمل' && d.status !== 'Completed').length,
          finished: docs.filter(d => d.status === 'مكتمل' || d.status === 'Completed').length
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
          projects: myProjects.filter(p => p.status !== 'مكتمل' && p.status !== 'Completed').length, 
          finished: myProjects.filter(p => p.status === 'مكتمل' || p.status === 'Completed').length 
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
      unsubAgency();
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
        toast({ title: language === 'ar' ? "تم تحديث الشعار" : "Logo Updated", description: language === 'ar' ? "تم تغيير هوية الوكالة بنجاح." : "Agency identity updated successfully." });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  const isLinked = !!profile?.clientId;

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir={dir}>
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
                className={`absolute -bottom-1 ${dir === 'rtl' ? '-left-1' : '-right-1'} h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-slate-800 transition-colors`}
              >
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t('dashboard_title')}</h1>
            <p className="text-[10px] text-slate-500 font-bold">{t('welcome_back')} {profile?.name}، {t('follow_updates')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <>
              <Button 
                variant="outline"
                onClick={() => setIsAboutDialogOpen(true)}
                className="rounded-xl h-11 px-6 font-black text-sm gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm active:scale-95 transition-all"
              >
                <Info className="h-4 w-4" /> {t('about_us')}
              </Button>
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline"
                    size="icon"
                    className="rounded-xl h-11 w-11 border-blue-100 text-blue-600 hover:bg-blue-50 shadow-sm active:scale-95 transition-all"
                    title={t('facebook')}
                  >
                    <Facebook className="h-5 w-5" />
                  </Button>
                </a>
              )}
            </>
          )}
          {isAdmin && perms.includes('p_testers') && (
            <Button onClick={() => setIsScheduleModalOpen(true)} className="rounded-xl h-11 px-6 font-black text-sm gap-2 shadow-md hover:scale-105 transition-all">
              <CalendarDays className="h-5 w-5" /> {language === 'ar' ? 'جدول الاختبارات الأسبوعي' : 'Weekly Test Schedule'}
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isAdmin ? (
          <>
            {perms.includes('p_clients') && <StatCard title={t('total_clients')} icon={<Users className="text-primary h-5 w-5" />} value={stats.clients} onClick={() => router.push('/clients')} />}
            {perms.includes('p_projects') && <StatCard title={t('active_projects')} icon={<Briefcase className="text-orange-500 h-5 w-5" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />}
            {perms.includes('p_support') && <StatCard title={t('support_inbox')} icon={<MessageSquare className={(stats.unreadSupport > 0 ? "text-rose-500 animate-pulse" : "text-indigo-500") + " h-5 w-5"} />} value={stats.unreadSupport > 0 ? `${stats.unreadSupport} ${t('unread_messages')}` : t('none')} onClick={() => router.push('/support')} />}
            {perms.includes('p_finances') && <StatCard title={t('payments')} icon={<CreditCard className="text-emerald-500 h-5 w-5" />} value={t('manage')} onClick={() => router.push('/payments')} />}
            {perms.includes('p_portal') && <StatCard title={t('users')} icon={<ShieldAlert className="text-rose-500 h-5 w-5" />} value={t('manage')} onClick={() => router.push('/users')} />}
          </>
        ) : (
          <>
            {perms.includes('p_projects') && <StatCard title={t('active_projects')} icon={<Briefcase className="text-orange-500 h-5 w-5" />} value={stats.projects} onClick={() => router.push('/projects?status=active')} />}
            {perms.includes('p_projects') && <StatCard title={t('finished_projects')} icon={<CheckCircle className="text-green-500 h-5 w-5" />} value={stats.finished} onClick={() => router.push('/projects?status=finished')} />}
            {perms.includes('p_support') && <StatCard title={t('support')} icon={<LifeBuoy className={(stats.unreadSupport > 0 ? "text-rose-500 animate-pulse" : "text-indigo-500") + " h-5 w-5"} />} value={stats.unreadSupport > 0 ? `${stats.unreadSupport} ${t('unread_messages')}` : t('request_support')} onClick={() => router.push('/support')} />}
            <StatCard title={language === 'ar' ? 'حالة الحساب' : 'Account Status'} icon={<ShieldCheck className={(isLinked ? "text-green-500" : "text-rose-500") + " h-5 w-5"} />} value={isLinked ? t('status_active') : t('status_pending')} onClick={() => router.push('/profile')} />
          </>
        )}
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-12 text-primary-foreground text-center relative overflow-hidden">
        <div className={`absolute top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} p-8 opacity-10 pointer-events-none`}>
          <Image src={agencyLogo} alt="Watermark" width={300} height={300} unoptimized className="object-contain" />
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black">{isAdmin ? t('admin_center') : t('client_center')}</h2>
          <p className="opacity-80 font-bold max-w-2xl mx-auto text-sm leading-relaxed">
            {isAdmin ? t('admin_desc') : t('client_desc')}
          </p>
          <div className="flex justify-center gap-4">
             <Button onClick={() => router.push(isAdmin ? (perms.includes('p_projects') ? '/projects' : '/profile') : '/support')} size="lg" className="rounded-2xl bg-white text-primary font-black shadow-2xl gap-3 h-14 px-10 hover:bg-slate-50 text-base">
               {isAdmin ? t('start_work') : t('request_support')} 
               {dir === 'rtl' ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
             </Button>
          </div>
        </div>
      </Card>

      <TestingScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />

      {/* About Us Dialog for Clients on Dashboard */}
      <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-2xl" dir={dir}>
          <div className="bg-primary p-8 text-primary-foreground relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Info className="h-32 w-32" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black flex items-center gap-3">
                <Info className="h-8 w-8" /> {t('about_us')}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold mt-2">
                {t('login_footer')}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-8">
            <div className="space-y-6">
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                <p className="text-slate-700 font-bold leading-loose whitespace-pre-line text-lg">
                  {aboutUs || (language === 'ar' ? "لا يوجد محتوى متاح حالياً." : "No content available at the moment.")}
                </p>
              </div>
              <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">شريككم في النجاح الرقمي</p>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">APP STORE Agency</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button 
              onClick={() => setIsAboutDialogOpen(false)}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl"
            >
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, icon, value, onClick }: any) {
  const { dir } = useTranslation();
  return (
    <Card className="rounded-[1.2rem] border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white p-2 group" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</CardTitle>
        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">{icon}</div>
      </CardHeader>
      <CardContent><div className={`text-sm font-black text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{value}</div></CardContent>
    </Card>
  );
}
