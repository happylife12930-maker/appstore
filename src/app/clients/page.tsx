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
  Wallet,
  Loader2,
  Briefcase,
  ExternalLink,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc } from "firebase/firestore";
import { AddClientModal, type ClientData } from "@/components/modals/add-client-modal";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// دالة توحيد النص للبحث (تحويل أرقام عربية، حذف مسافات)
const normalizeText = (text: string) => {
  if (!text) return '';
  const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(text).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

function ClientsContent() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // التحقق من وجود بحث قادم من رابط (مثلاً من صفحة المشاريع)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!db) return;
    
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
      setLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubClients(); unsubProjects(); };
  }, []);

  const clientsWithProjects = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      return {
        ...client,
        associatedProjects: clientProjects
      };
    });
  }, [clients, projects]);

  const filteredClients = useMemo(() => {
    const s = normalizeText(searchQuery);
    if (!s) return clientsWithProjects;

    return clientsWithProjects.filter(c => {
      const nameMatch = normalizeText(c.name).includes(s);
      const phoneMatch = normalizeText(c.phone).includes(s);
      const companyMatch = normalizeText(c.company || "").includes(s);
      const projectMatch = c.associatedProjects.some(p => 
        normalizeText(p.name || "").includes(s)
      );
      
      return nameMatch || phoneMatch || companyMatch || projectMatch;
    });
  }, [clientsWithProjects, searchQuery]);

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
      setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 300);
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

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/clients");
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
            <p className="text-slate-500 font-bold">عرض وتعديل بيانات العملاء والربط المالي</p>
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
          className="pr-12 pl-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        )}
      </div>

      {searchParams.get('q') && (
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
          <p className="text-sm font-bold text-primary">عرض نتائج البحث عن: <span className="font-black underline">{searchParams.get('q')}</span></p>
          <Button variant="ghost" size="sm" onClick={clearSearch} className="font-black text-xs text-primary h-8 px-4">عرض كل العملاء</Button>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Users className="h-20 w-20" />
            <p className="text-xl font-black">لم يتم العثور على نتائج للبحث</p>
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
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 truncate" dir="ltr">{client.phone}</span>
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
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm truncate max-w-[200px]">{client.email || '---'}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span className="text-xs font-black">المشاريع المرتبطة</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {client.associatedProjects && client.associatedProjects.length > 0 ? (
                        client.associatedProjects.map((p: any) => (
                          <Link key={p.id} href="/projects">
                            <Button variant="outline" size="sm" className="h-7 rounded-lg text-[10px] font-bold border-slate-100 hover:bg-primary/5 hover:text-primary gap-1">
                              {p.name} <ExternalLink className="h-2 w-2" />
                            </Button>
                          </Link>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">لا توجد مشاريع حالياً</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-black text-xs text-slate-400">الرصيد</span>
                    </div>
                    <span className={`font-black text-lg ${client.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                      {(client.balance || 0).toLocaleString('ar-EG')} ج.م
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

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ClientsContent />
    </Suspense>
  );
}
