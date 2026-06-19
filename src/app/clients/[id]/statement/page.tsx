"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Printer, Building2, User, Phone, Mail, Calendar, Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ClientStatementPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      if (!db || !params.id) return;
      try {
        const docRef = doc(db, "clients", params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setClient({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching client for statement:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [params.id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">لم يتم العثور على بيانات العميل</h2>
        <Button onClick={() => router.push("/clients")} className="mt-4">العودة لقائمة العملاء</Button>
      </div>
    );
  }

  const balance = Number(client.totalInvoices || 0) - Number(client.totalPayments || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* CSS مخصص للطباعة لضمان إخفاء العناصر غير الضرورية وتنسيق الصفحة */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .max-w-4xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .shadow-2xl { shadow: none !important; box-shadow: none !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; }
          .print-border { border: 1px solid #e2e8f0 !important; }
          main { padding: 0 !important; }
          .bg-primary { background-color: #1e293b !important; -webkit-print-color-adjust: exact; }
          .text-primary-foreground { color: white !important; }
        }
      `}} />

      <header className="flex justify-between items-center no-print">
        <Button variant="ghost" onClick={() => router.push("/clients")} className="gap-2 font-bold">
          <ArrowRight className="h-4 w-4" /> العودة للعملاء
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white shadow-lg h-12 px-6">
            <Printer className="h-5 w-5" /> طباعة الكشف
          </Button>
        </div>
      </header>

      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white print-border">
        <div className="bg-primary p-10 text-primary-foreground text-center">
          <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 no-print">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black mb-2">كشف حساب مالي تفصيلي</h1>
          <p className="opacity-80 font-bold">APP STORE AGENCY • {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-800 border-b pb-2">بيانات العميل</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl"><User className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">الاسم</p>
                    <p className="font-black text-slate-800">{client.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl"><Mail className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">البريد</p>
                    <p className="font-bold text-slate-800">{client.email || "غير متوفر"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl"><Phone className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">رقم الهاتف</p>
                    <p className="font-bold text-slate-800" dir="ltr">{client.phone || "غير متوفر"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-800 border-b pb-2">تفاصيل المشروع</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl"><Building2 className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">اسم المشروع</p>
                    <p className="font-black text-blue-600">{client.projectName || "بدون اسم"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl"><Calendar className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">تاريخ التعاقد</p>
                    <p className="font-bold text-slate-800">{client.startDate || "غير متوفر"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> الملخص المالي (ج.م)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-500 mb-1">إجمالي الفاتورة</p>
                <p className="text-2xl font-black text-slate-800">{(client.totalInvoices || 0).toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
              </div>
              <div className="p-6 bg-green-50 rounded-3xl border border-green-100 text-center">
                <p className="text-sm font-bold text-green-600 mb-1">إجمالي المدفوعات</p>
                <p className="text-2xl font-black text-green-700">{(client.totalPayments || 0).toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
              </div>
              <div className={`p-6 rounded-3xl border text-center ${balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-100 border-slate-200'}`}>
                <p className={`text-sm font-bold mb-1 ${balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>الرصيد المتبقي</p>
                <p className={`text-2xl font-black ${balance > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{balance.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-dashed space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-bold text-slate-400">حالة الحساب النهائية:</div>
              <Badge variant={balance <= 0 ? "default" : "destructive"} className="px-6 py-2 rounded-xl font-black text-lg">
                {balance <= 0 ? "حساب مُغلق / مدفوع بالكامل" : `متبقي مبلغ ${balance.toLocaleString('ar-EG')} ج.م`}
              </Badge>
            </div>
            <p className="text-center text-xs text-slate-400 mt-10 italic">شكراً لتعاملكم مع وكالة APP STORE - نعتز بثقتكم دوماً.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
