"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3, 
  Loader2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc } from "firebase/firestore";
import { AddClientModal, type ClientData } from "@/components/modals/add-client-modal";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function ClientsContent() {
  const { profile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (!db) return;
    
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
      setLoading(false);
    }, (err) => {
      console.error("Clients Listener Error:", err);
    });

    return () => unsubClients();
  }, [isAdmin, authLoading]);

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return clients;
    return clients.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.phone?.includes(s) || 
      c.company?.toLowerCase().includes(s)
    );
  }, [clients, searchQuery]);

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري التحميل...</p>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-slate-200" />
        <h2 className="text-xl font-black text-slate-800">صلاحية وصول محدودة</h2>
        <Button onClick={() => router.push("/")} className="mt-4 rounded-xl h-10 px-6 font-black">العودة للرئيسية</Button>
      </div>
    );
  }

  const handleSaveClient = async (data: ClientData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "clients", data.id), data);
        toast({ title: "تم التحديث بنجاح" });
      } else {
        await addDoc(collection(db, "clients"), data);
        toast({ title: "تمت إضافة العميل بنجاح" });
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">إدارة العملاء</h1>
            <p className="text-[10px] text-slate-500 font-bold">عرض وتعديل بيانات العملاء</p>
          </div>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="rounded-xl h-11 px-6 font-black text-sm gap-2">
          <Plus className="h-5 w-5" /> إضافة عميل
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input 
          placeholder="ابحث بالاسم أو رقم الهاتف..." 
          className="pr-12 h-12 rounded-xl font-bold border-none shadow-sm bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">{client.name?.[0]}</div>
                <CardTitle className="text-sm font-black truncate max-w-[120px]">{client.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="h-8 w-8 rounded-lg text-slate-400"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id!)} className="h-8 w-8 rounded-lg text-rose-300 hover:text-rose-50"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">التواصل</p>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-2" dir="ltr"><Phone className="h-3 w-3 text-primary" /> {client.phone}</span>
                  {client.email && <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2" dir="ltr"><Mail className="h-3 w-3" /> {client.email}</span>}
                </div>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">الرصيد</span>
                <span className={`font-black text-xs ${client.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>{(client.balance || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingClient(null); }}
        onSave={handleSaveClient}
        isLoading={isSaving}
        initialData={editingClient}
      />
    </div>
  );
}

export default function ClientsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><ClientsContent /></Suspense>;
}
