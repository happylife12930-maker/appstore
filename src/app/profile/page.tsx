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
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/language-provider";

export default function ProfilePage() {
  const { t, dir, language } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [clientData, setClientData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !db) return;

    if (!profile) {
      setLoading(false);
      return;
    }

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
      unsubClient(); 
      unsubProjects(); 
    };
  }, [profile, authLoading]);

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  const canViewFinances = profile?.role === 'admin' || profile?.permissions.includes('p_finances');
  const canViewProjects = profile?.role === 'admin' || profile?.permissions.includes('p_projects');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20" dir={dir}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
            <CardHeader className="bg-slate-50 p-8 text-center border-b">
              <div className="h-24 w-24 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4">
                {profile?.name?.[0]}
              </div>
              <CardTitle className="text-xl font-black">{profile?.name}</CardTitle>
              <Badge variant="outline" className="mt-2 rounded-lg font-black bg-primary/5 text-primary">
                {profile?.role === 'client' ? t('role_client') : t('role_admin')}
              </Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="font-bold text-sm">{t('account_status')}: {clientData ? t('status_active') : t('status_pending')}</span>
              </div>
            </CardContent>
          </Card>

          {canViewFinances ? (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
              <Wallet className="absolute -bottom-4 -left-4 h-32 w-32 opacity-10 rotate-12" />
              <div className="relative z-10 space-y-2">
                <p className="font-black text-primary-foreground/70 uppercase text-xs tracking-widest">{t('net_balance')}</p>
                <h2 className="text-4xl font-black">
                  {(clientData?.balance || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <span className="text-lg">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
                </h2>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-100 p-8 text-slate-400 text-center border-dashed border-2">
              <Lock className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="font-black text-xs">{t('finances_hidden')}</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {canViewFinances && (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
              <CardHeader className="bg-slate-50 border-b p-8">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" /> {t('financial_statement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('total_invoices')}</p>
                    <p className="text-2xl font-black text-slate-800">
                      {(clientData?.totalInvoices || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  </div>
                  <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                    <p className="text-[10px] font-black text-green-600 uppercase mb-1">{t('total_payments')}</p>
                    <p className="text-2xl font-black text-green-700">
                      {(clientData?.totalPayments || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canViewProjects ? (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
              <CardHeader className="bg-slate-50 border-b p-8">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" /> {t('linked_projects')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {projects.map(project => (
                  <div key={project.id} className="p-5 rounded-2xl border bg-white hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{project.name}</p>
                        <Badge className="text-[8px] font-black mt-1">{project.status}</Badge>
                      </div>
                    </div>
                    <div className="font-black text-slate-700 text-sm">
                      {canViewFinances ? `${(project.cost || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}` : '---'}
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-center py-10 opacity-30 font-bold">{t('no_projects_recorded')}</p>}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50 p-20 text-center border-dashed border-2">
               <Lock className="h-16 w-16 mx-auto mb-4 opacity-10" />
               <p className="font-black text-slate-400">{t('projects_permission_disabled')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
