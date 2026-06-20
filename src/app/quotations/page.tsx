
"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { 
  Calculator, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon,
  Loader2,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc, query, orderBy } from "firebase/firestore";
import { QuotationModal } from "@/components/modals/quotation-modal";
import { QuotationDetailsModal } from "@/components/modals/quotation-details-modal";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

function QuotationsContent() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== 'admin' && !authLoading) {
      router.push("/");
      return;
    }
    if (!db || authLoading) return;

    const q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Quotations Access Error:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [profile, authLoading, router]);

  const handleSaveQuotation = async (data: any) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const quotationData = {
        ...data,
        updatedAt: new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString(),
      };

      if (data.id) {
        await setDoc(doc(db, "quotations", data.id), quotationData);
        toast({ title: "تم التحديث", description: "تم تعديل عرض السعر بنجاح" });
      } else {
        await addDoc(collection(db, "quotations"), quotationData);
        toast({ title: "تم الإرسال", description: "تم إنشاء عرض السعر الجديد بنجاح" });
      }
      setIsModalOpen(false);
      setEditingQuotation(null);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ عرض السعر", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف عرض السعر هذا؟")) return;
    try {
      await deleteDoc(doc(db, "quotations", id));
      toast({ title: "تم الحذف", description: "تمت إزالة عرض السعر نهائياً" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل عروض الأسعار...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Calculator className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة عروض الأسعار</h1>
            <p className="text-slate-500 font-bold">إنشاء وتحليل عروض الأسعار الذكية وإدارة الأصول المرفقة</p>
          </div>
        </div>
        <Button 
          onClick={() => { setEditingQuotation(null); setIsModalOpen(true); }}
          className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="h-6 w-6" /> إنشاء عرض سعر جديد
        </Button>
      </header>

      {quotations.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <FileText className="h-20 w-20" />
            <p className="text-xl font-black">لا توجد عروض أسعار حالياً</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotations.map((q) => (
            <Card key={q.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden flex flex-col border border-slate-50 group">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {q.images?.[0] ? (
                  <img src={q.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                   <Badge className="rounded-xl font-black bg-white/90 text-primary border-none shadow-sm backdrop-blur-sm">
                    {q.images?.length || 0} صور
                  </Badge>
                  <Badge className="rounded-xl font-black bg-primary/90 text-white border-none shadow-sm backdrop-blur-sm">
                    {q.status || 'معلق'}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black truncate max-w-[200px]">{q.projectName}</CardTitle>
                    <p className="text-xs font-bold text-slate-400 mt-1">المستفيد: {q.clientName || '---'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingQuotation(q); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl">
                      <Edit3 className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuotation(q.id)} className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> التكلفة
                    </p>
                    <p className="text-sm font-black text-slate-800">{(q.estimatedCost || 0).toLocaleString('ar-EG')} ج.م</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> المدة
                    </p>
                    <p className="text-sm font-black text-slate-800">{q.executionTimelineDays || 0} يوم</p>
                  </div>
                </div>

                <Button 
                  onClick={() => { setViewingQuotation(q); setIsDetailsOpen(true); }}
                  className="w-full rounded-2xl h-12 font-black border-slate-200 gap-2 hover:bg-primary transition-all shadow-md group-hover:scale-[1.02]"
                >
                  <ExternalLink className="h-4 w-4" /> عرض الجاليري والتفاصيل
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuotationModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingQuotation(null); }}
        onSave={handleSaveQuotation}
        isLoading={isSaving}
        initialData={editingQuotation}
      />

      <QuotationDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setViewingQuotation(null); }}
        quotation={viewingQuotation}
      />
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <QuotationsContent />
    </Suspense>
  );
}
