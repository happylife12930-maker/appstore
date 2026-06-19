"use client";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  FileText,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AddClientModal, ClientData } from "@/components/modals/add-client-modal";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "clients"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => a.name?.localeCompare(b.name));
      setClients(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveClient = async (data: ClientData) => {
    try {
      if (editingClient) {
        await updateDoc(doc(db!, "clients", editingClient.id), { ...data });
        toast({ title: "تم التحديث", description: "تم تحديث البيانات بنجاح." });
      } else {
        await addDoc(collection(db!, "clients"), { 
          ...data, 
          startDate: new Date().toLocaleDateString('ar-EG')
        });
        toast({ title: "تمت الإضافة", description: "تم إضافة العميل بنجاح." });
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حفظ البيانات.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(s) ||
      c.phone?.includes(searchQuery) ||
      c.projectName?.toLowerCase().includes(s)
    );
  }, [clients, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">سجل العملاء</h1>
          <p className="text-slate-500 font-bold">إدارة البيانات والمستحقات المالية</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="rounded-2xl h-14 font-black shadow-lg gap-2 px-8">
          <Plus className="h-6 w-6" /> إضافة عميل
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <input 
          placeholder="ابحث بالاسم، الهاتف، أو اسم المشروع..." 
          className="w-full pr-12 h-16 rounded-[1.5rem] border-none shadow-sm bg-white font-bold text-xl outline-none focus:ring-2 focus:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((client) => {
          const balance = (client.totalInvoices || 0) - (client.totalPayments || 0);
          return (
            <Card key={client.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                    {client.name?.[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800">{client.name}</CardTitle>
                    <Badge variant="secondary" className="font-bold mt-0.5">{client.projectName || "بدون مشروع"}</Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl font-bold min-w-[150px]">
                    <DropdownMenuItem onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="gap-2 p-3"><Edit3 className="h-4 w-4" /> تعديل</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/statement`)} className="gap-2 p-3"><FileText className="h-4 w-4" /> كشف حساب</DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { if(confirm("حذف العميل؟")) await deleteDoc(doc(db!, "clients", client.id)) }} className="text-rose-600 gap-2 p-3"><Trash2 className="h-4 w-4" /> حذف</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-2 text-sm text-slate-500 font-bold">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                    <Phone className="h-4 w-4 text-primary" /> <span dir="ltr">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                    <Mail className="h-4 w-4 text-primary" /> {client.email}
                  </div>
                </div>
                <div className="p-5 bg-slate-900 rounded-[2rem] flex justify-between items-center text-white">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black">المتبقي</p>
                    <p className={`text-xl font-black ${balance > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                      {balance.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${client.id}/statement`)} className="rounded-xl font-black bg-white/10 border-white/20 text-white">التفاصيل</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingClient(null); }} 
        onSave={handleSaveClient}
        isLoading={false}
        initialData={editingClient}
      />
    </div>
  );
}
