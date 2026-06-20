
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Wallet, 
  CreditCard, 
  Briefcase, 
  Loader2, 
  ShieldCheck, 
  LayoutDashboard,
  Printer,
  Calendar,
  FileText,
  BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/language-provider";

export default function ProfilePage() {
  const { profile, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [clientData, setClientData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !db) return;

    if (!profile) {
      setLoading(false);
      return;
    }

    // إذا كان العميل مربوطاً، نجلب بياناته المالية من جدول العملاء
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

    // جلب مشاريع العميل
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

  const handlePrint = () => {
    window.print();
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل ملفك الشخصي...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20" dir="rtl">
      {/* رأس الصفحة */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border no-print">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">حسابي الشخصي</h1>
            <p className="text-slate-500 font-bold">إدارة بياناتك ومتابعة كشف الحساب المالي</p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={handlePrint}
          className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-sm border-slate-200"
        >
          <Printer className="h-5 w-5" /> طباعة كشف الحساب
        </Button>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* بيانات المستخدم والربط */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
            <CardHeader className="bg-slate-50 p-8 text-center border-b">
              <div className="h-24 w-24 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4">
                {profile?.name?.[0]}
              </div>
              <CardTitle className="text-xl font-black">{profile?.name}</CardTitle>
              <Badge variant="outline" className="mt-2 rounded-lg font-black bg-primary/5 text-primary">
                {profile?.role === 'client' ? 'مستفيد معتمد' : 'مدير النظام'}
              </Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="font-bold text-sm">الحالة: {clientData ? 'مفعل' : 'قيد الربط'}</span>
              </div>
              {clientData?.phone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm" dir="ltr">{clientData.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ملخص الحالة المالية */}
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
            <Wallet className="absolute -bottom-4 -left-4 h-32 w-32 opacity-10 rotate-12" />
            <div className="relative z-10 space-y-2">
              <p className="font-black text-primary-foreground/70 uppercase text-xs tracking-widest">صافي الرصيد المستحق</p>
              <h2 className="text-4xl font-black">
                {(clientData?.balance || 0).toLocaleString('ar-EG')} <span className="text-lg">ج.م</span>
              </h2>
              <div className="pt-4 mt-4 border-t border-white/10 flex justify-between text-xs font-bold opacity-80">
                <span>المشاريع: {projects.length}</span>
                <span>الحالة: {clientData?.balance > 0 ? 'متبقي دفعات' : 'خالص'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* كشف الحساب والمشاريع */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
            <CardHeader className="bg-slate-50 border-b p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" /> كشف الحساب التفصيلي
                </CardTitle>
                <Badge variant="outline" className="rounded-lg h-7 font-black">
                  تحديث: {new Date().toLocaleDateString('ar-EG')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي التعاقدات</p>
                  <p className="text-2xl font-black text-slate-800">
                    {(clientData?.totalInvoices || 0).toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                  <p className="text-[10px] font-black text-green-600 uppercase mb-1">إجمالي المدفوعات</p>
                  <p className="text-2xl font-black text-green-700">
                    {(clientData?.totalPayments || 0).toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
              </div>

              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> تفاصيل المشاريع المرتبطة
              </h3>
              <div className="space-y-4">
                {projects.map(project => (
                  <div key={project.id} className="p-5 rounded-2xl border bg-white hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[8px] font-black rounded-md h-5">
                            {project.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400">
                            نسبة الإنجاز: {project.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left font-black text-slate-700">
                      {(project.cost || 0).toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="p-10 text-center opacity-30 italic font-bold">
                    لا توجد مشاريع مسجلة حالياً
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* نصائح أو تواصل سريع */}
          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 no-print">
            <div>
              <h4 className="text-xl font-black mb-2">هل لديك استفسار حول كشف الحساب؟</h4>
              <p className="opacity-70 font-bold text-sm">فريق الدعم المالي متاح دائماً لمراجعة أي تفاصيل معك.</p>
            </div>
            <Button className="rounded-2xl h-14 px-10 font-black text-lg bg-white text-slate-900 hover:bg-slate-100">
              تحدث مع المحاسب
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
