
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
  X
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
        toast({ title: "تم التحديث", description: "تم تعديل العرض بنجاح" });
      } else {
        await addDoc(collection(db, "quotations"), quotationData);
        toast({ title: "تم الحفظ", description: "تم إنشاء العرض الجديد بنجاح" });
      }
      setIsModalOpen(false);
      setEditingQuotation(null);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    try {
      await deleteDoc(doc(db, "quotations", id));
      toast({ title: "تم الحذف", description: "تمت إزالة العرض نهائياً" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل المعرض...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-primary/10 rounded-[2rem] text-primary">
            <ImageIcon className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">معرض عروض الأسعار</h1>
            <p className="text-slate-500 font-bold text-lg">ارفع صور التصاميم والعروض وقدمها بشكل احترافي</p>
          </div>
        </div>
        <Button 
          onClick={() => { setEditingQuotation(null); setIsModalOpen(true); }}
          className="rounded-3xl h-16 px-10 font-black text-xl gap-3 shadow-xl hover:scale-105 transition-all bg-primary"
        >
          <Plus className="h-7 w-7" /> إضافة عرض جديد
        </Button>
      </header>

      {quotations.length === 0 ? (
        <Card className="rounded-[3rem] border-none shadow-sm py-32 text-center bg-white border-2 border-dashed border-slate-200">
          <div className="flex flex-col items-center gap-6 opacity-30">
            <ImageIcon className="h-24 w-24" />
            <p className="text-2xl font-black">لا توجد صور أو عروض مرفوعة حالياً</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {quotations.map((q) => (
            <div key={q.id} className="space-y-4 group">
              {/* صندوق الاسم فوق الصورة */}
              <div className="bg-white p-6 rounded-[2rem] shadow-md border-r-8 border-primary flex items-center justify-between group-hover:shadow-lg transition-all">
                <h2 className="text-2xl font-black text-slate-800 truncate">{q.projectName}</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingQuotation(q); setIsModalOpen(true); }} className="h-10 w-10 rounded-xl hover:bg-primary/5">
                    <Edit3 className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuotation(q.id)} className="h-10 w-10 rounded-xl hover:bg-rose-50">
                    <Trash2 className="h-5 w-5 text-rose-300 group-hover:text-rose-500 transition-colors" />
                  </Button>
                </div>
              </div>

              {/* معرض الصور المرفق */}
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white group-hover:scale-[1.01] transition-all cursor-pointer" onClick={() => { setViewingQuotation(q); setIsDetailsOpen(true); }}>
                <div className="relative h-[400px] bg-slate-100 flex items-center justify-center">
                  {q.images?.[0] ? (
                    <>
                      <img src={q.images[0]} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <Badge className="bg-white/20 backdrop-blur-md text-white border-none px-4 py-2 rounded-xl font-black">
                          {q.images.length} صور في العرض
                        </Badge>
                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <ExternalLink className="h-6 w-6" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <ImageIcon className="h-20 w-20" />
                      <p className="font-black">لا توجد صور في هذا العرض</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
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
