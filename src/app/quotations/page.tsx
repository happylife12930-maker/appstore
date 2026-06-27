
"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { Plus, Edit3, Trash2, ExternalLink, Image as ImageIcon, Loader2, X, Lock } from "lucide-react";
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

  const isAdmin = profile?.role === 'admin';
  const hasProjectPermission = isAdmin || (profile?.permissions || []).includes('p_projects');

  useEffect(() => {
    if (!profile && !authLoading) { router.push("/login"); return; }
    if (!db || authLoading || !hasProjectPermission) {
      if (!authLoading) setLoading(false);
      return;
    }
    const unsub = onSnapshot(query(collection(db, "quotations"), orderBy("createdAt", "desc")), (snap) => {
      setQuotations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [profile, authLoading, router, hasProjectPermission]);

  if (authLoading || loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  if (!hasProjectPermission) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">عذراً، القسم محجوب</h2>
          <p className="text-slate-500 font-bold text-sm">ليس لديك صلاحية عرض عروض الأسعار. يرجى التواصل مع الإدارة لطلب الصلاحية.</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const handleSaveQuotation = async (data: any) => {
    if (!db || !isAdmin) return;
    setIsSaving(true);
    try {
      if (data.id) await setDoc(doc(db, "quotations", data.id), data);
      else await addDoc(collection(db, "quotations"), { ...data, createdAt: new Date().toISOString() });
      setIsModalOpen(false);
      toast({ title: "تم الحفظ" });
    } catch (err) { toast({ title: "خطأ", variant: "destructive" }); } finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
        <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-2xl text-primary"><ImageIcon className="h-6 w-6" /></div><div><h1 className="text-2xl font-black text-slate-800">معرض عروض الأسعار</h1><p className="text-slate-500 font-bold text-xs">تصفح أحدث التصاميم</p></div></div>
        {isAdmin && <Button onClick={() => { setEditingQuotation(null); setIsModalOpen(true); }} className="rounded-xl h-12 px-8 font-black text-sm gap-2 shadow-lg bg-primary"><Plus className="h-5 w-5" /> إضافة عرض جديد</Button>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {quotations.map((q) => (
          <div key={q.id} className="space-y-4 group">
            <div className="bg-white p-4 px-6 rounded-[1.5rem] shadow-sm border-r-8 border-primary flex items-center justify-between group-hover:shadow-md transition-all"><h2 className="text-lg font-black text-slate-800 truncate">{q.projectName}</h2>{isAdmin && <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingQuotation(q); setIsModalOpen(true); }} className="h-8 w-8"><Edit3 className="h-4 w-4" /></Button></div>}</div>
            <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden bg-white group-hover:scale-[1.01] transition-all cursor-pointer" onClick={() => { setViewingQuotation(q); setIsDetailsOpen(true); }}>
              <div className="relative min-h-[250px] max-h-[500px] bg-slate-100 flex items-center justify-center overflow-hidden">
                {q.images?.[0] ? <><img src={q.images[0]} className="w-full h-auto object-contain" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-5 right-5 flex items-center gap-3"><Badge className="bg-white/20 backdrop-blur-md text-white border-none px-3 py-1 rounded-lg font-black text-[10px]">{q.images.length} صور</Badge><div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"><ExternalLink className="h-4 w-4" /></div></div></> : <ImageIcon className="h-12 w-12 text-slate-300" />}
              </div>
            </Card>
          </div>
        ))}
      </div>
      {isAdmin && <QuotationModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingQuotation(null); }} onSave={handleSaveQuotation} isLoading={isSaving} initialData={editingQuotation} />}
      <QuotationDetailsModal isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); setViewingQuotation(null); }} quotation={viewingQuotation} />
    </div>
  );
}

export default function QuotationsPage() { return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><QuotationsContent /></Suspense>; }
