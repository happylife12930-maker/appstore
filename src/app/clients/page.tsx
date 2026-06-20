
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3, 
  Wallet,
  Loader2,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc } from "firebase/firestore";
import { AddClientModal, type ClientData } from "@/components/modals/add-client-modal";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // حل مشكلة الفريز: التأكد من استعادة التحكم في الشاشة عند إغلاق المودال
  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // تحسين البحث ليشمل الاسم والهاتف واسم المشروع
  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return clients.filter(c => 
      (c.name || "").toLowerCase().includes(s) || 
      (c.phone || "").includes(searchQuery) ||
      (c.projectName || "").toLowerCase().includes(s)
    );
  }, [clients, searchQuery]);

  const handleSaveClient = async (data: ClientData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "clients", data.id), data);
        toast({ title: "تم التحديث", description: "تم تعديل بيانات العميل بنجاح" });
      } else {
        await addDoc(collection(db, "clients"), data);
        toast({ title: "تمت الإضافة", description: "تمت إضافة العميل الجديد بنجاح" });
      }
      setIsModalOpen(false);
      setEditingClient(null);
      
      // حل إضافي لمشكلة الفريز: إجبار المتصفح على استعادة التفاعل
      setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 100);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف", description: "تمت إزالة العميل من النظام" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل قائمة العملاء...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة العملاء</h1>
            <p className="text-slate-500 font-bold">ابحث بالاسم، الهاتف، أو اسم المشروع</p>
          </div>
        </div>
        <Button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="h-6 w-6" /> إضافة عميل جديد
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث باسم العميل، رقم الهاتف، أو اسم المشروع..." 
          className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Users className="h-20 w-20" />
            <p className="text-xl font-black">لم يتم العثور على نتائج</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group border border-slate-50">
              <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-inner">
                    {client.name?.[0] || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <CardTitle className="text-lg font-black truncate max-w-[150px]">{client.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Briefcase className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{client.projectName || 'بدون مشروع'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl">
                    <Edit3 className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id!)} className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm" dir="ltr">{client.phone || '---'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm truncate max-w-[200px]">{client.email || '---'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-black text-xs text-slate-400">الرصيد</span>
                    </div>
                    <span className={`font-black text-lg ${client.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                      {client.balance.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
