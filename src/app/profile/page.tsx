"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Wallet, 
  Briefcase, 
  Loader2, 
  ShieldCheck, 
  FileText,
  BadgeCheck,
  Lock,
  Info,
  Save,
  CheckCircle2,
  Facebook,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, setDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProfilePage() {
  const { t, dir, language } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [clientData, setClientData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // About Us feature states
  const [aboutUs, setAboutUs] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !db) return;

    if (!profile) {
      setLoading(false);
      return;
    }

    // Monitor agency settings (including About Us and Social Links)
    const unsubAgency = onSnapshot(doc(db, "settings", "agency"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAboutUs(data.aboutUs || "");
        setFacebookUrl(data.facebookUrl || "");
      }
    });

    let unsubClient = () => {};
    if (profile.clientId) {
      unsubClient = onSnapshot(doc(db, "clients", profile.clientId), (snap) => {
        if (snap.exists()) {
          setClientData({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      }, (err) => {
        console.error("Profile Fetch Error:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    const q = query(
      collection(db, "projects"),
      where("clientId", "==", profile.clientId || "non-existent")
    );
    const unsubProjects = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubAgency();
      unsubClient(); 
      unsubProjects(); 
    };
  }, [profile, authLoading]);

  const handleSaveAgencyInfo = async () => {
    if (!db || !isAdmin) return;
    setIsSavingAbout(true);
    try {
      await setDoc(doc(db, "settings", "agency"), { 
        aboutUs, 
        facebookUrl 
      }, { merge: true });
      
      toast({ 
        title: language === 'ar' ? "تم الحفظ" : "Saved", 
        description: language === 'ar' ? "تم تحديث بيانات الوكالة بنجاح." : "Agency information updated successfully." 
      });
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSavingAbout(false);
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  const canViewFinances = profile?.role === 'admin' || (profile?.permissions || []).includes('p_finances');
  const canViewProjects = profile?.role === 'admin' || (profile?.permissions || []).includes('p_projects');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('profile_title')}</h1>
            <p className="text-slate-500 font-bold">{t('profile_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
            <CardHeader className="bg-slate-50 p-8 text-center border-b">
              <div className="h-24 w-24 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4">
                {profile?.name?.[0]}
              </div>
              <CardTitle className="text-xl font-black">{profile?.name}</CardTitle>
              <Badge variant="outline" className="mt-2 rounded-lg font-black bg-primary/5 text-primary">
                {profile?.role === 'client' ? t('role_client') : profile?.role === 'admin' ? t('role_admin') : t('manage')}
              </Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm truncate">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-sm">{t('account_status')}: {clientData || isAdmin ? t('status_active') : t('status_pending')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
              <CardHeader className="bg-primary/5 p-6 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> {t('edit_about_us')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 pr-2">{t('about_us')}</Label>
                  <Textarea 
                    value={aboutUs} 
                    onChange={(e) => setAboutUs(e.target.value)}
                    placeholder={t('about_us_placeholder')}
                    className="min-h-[150px] rounded-2xl font-bold text-sm border-slate-200 focus-visible:ring-primary/20 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" /> {t('facebook_link')}
                  </Label>
                  <Input 
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/your-page"
                    className="rounded-xl h-11 font-bold text-xs bg-slate-50/50 border-slate-200"
                    dir="ltr"
                  />
                </div>

                <Button 
                  onClick={handleSaveAgencyInfo} 
                  disabled={isSavingAbout}
                  className="w-full h-14 rounded-2xl font-black gap-2 shadow-lg active:scale-95 transition-all"
                >
                  {isSavingAbout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          )}

          {!isAdmin && canViewFinances && (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
              <Wallet className="absolute -bottom-4 -left-4 h-32 w-32 opacity-10 rotate-12" />
              <div className="relative z-10 space-y-2">
                <p className="font-black text-primary-foreground/70 uppercase text-[10px] tracking-widest">{t('net_balance')}</p>
                <h2 className="text-4xl font-black">
                  {(clientData?.balance || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <span className="text-lg">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
                </h2>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-8 space-y-6">
          {!isAdmin && canViewFinances && (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
              <CardHeader className="bg-slate-50 border-b p-8">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
                  <FileText className="h-6 w-6 text-primary" /> {t('financial_statement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('total_invoices')}</p>
                    <p className="text-3xl font-black text-slate-800">
                      {(clientData?.totalInvoices || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <small className="text-sm">{language === 'ar' ? 'ج.م' : 'EGP'}</small>
                    </p>
                  </div>
                  <div className="p-8 bg-green-50 rounded-[2rem] border border-green-100 flex flex-col gap-1">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-wider">{t('total_payments')}</p>
                    <p className="text-3xl font-black text-green-700">
                      {(clientData?.totalPayments || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <small className="text-sm">{language === 'ar' ? 'ج.م' : 'EGP'}</small>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin ? (
             <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white relative overflow-hidden min-h-[400px] flex items-center">
                <BadgeCheck className="absolute -bottom-10 -right-10 h-64 w-64 opacity-5 rotate-12" />
                <div className="relative z-10 space-y-6">
                  <h2 className="text-4xl font-black">{t('admin_center')}</h2>
                  <p className="opacity-70 font-bold leading-relaxed text-lg max-w-2xl">
                    {t('admin_desc')}
                  </p>
                </div>
             </Card>
          ) : (
            <>
              {canViewProjects ? (
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
                  <CardHeader className="bg-slate-50 border-b p-8">
                    <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
                      <Briefcase className="h-6 w-6 text-primary" /> {t('linked_projects')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    {projects.map(project => (
                      <div key={project.id} className="p-6 rounded-2xl border bg-white hover:bg-slate-50 transition-all flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <BadgeCheck className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-base">{project.name}</p>
                            <Badge className="text-[9px] font-black mt-1 px-3 bg-slate-100 text-slate-600 border-none">{project.status}</Badge>
                          </div>
                        </div>
                        <div className="font-black text-slate-700 text-lg">
                          {canViewFinances ? `${(project.cost || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}` : '---'}
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                        <Briefcase className="h-12 w-12" />
                        <p className="font-black text-lg">{t('no_projects_recorded')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50 p-24 text-center border-dashed border-2">
                   <Lock className="h-20 w-20 mx-auto mb-6 opacity-10" />
                   <p className="font-black text-slate-400 text-xl">{t('projects_permission_disabled')}</p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
