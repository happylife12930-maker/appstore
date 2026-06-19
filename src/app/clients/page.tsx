
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  FileText,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
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
      const clientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      clientList.sort((a, b) => a.name?.localeCompare(b.name));
      setClients(clientList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveClient = async (data: ClientData) => {
    try {
      if (editingClient) {
        await updateDoc(doc(db!, "clients", editingClient.id), { ...data });
        toast({ title: "تم التحديث", description: "تم تحديث بيانات العميل بنجاح." });
      } else {
        await addDoc(collection(db!, "clients"), { 
          ...data, 
          startDate: new Date().toLocaleDateString('ar-EG')
        });
        toast({ title: "تمت الإضافة", description: "تم إضافة العميل الجديد بنجاح." });
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حفظ البيانات.", variant: "destructive" });
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchQuery) ||
      client.projectName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">إدارة العملاء</h1>
          <p className="text-slate-500 font-bold">قائمة العملاء والمستحقات المالية</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="rounded-2xl h-12 font-black shadow-lg gap-2">
          <Plus className="h-5 w-5" /> إضافة عميل
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث بالاسم، رقم الهاتف، أو المشروع..." 
          className="pr-12 h-14 rounded-2xl border-none shadow-sm bg-white font-bold text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const balance = (client.totalInvoices || 0) - (client.totalPayments || 0);
          return (
            <Card key={client.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                    {client.name?.[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800">{client.name}</CardTitle>
                    <Badge variant="secondary" className="font-bold text-[10px] mt-1">{client.projectName || "بدون مشروع"}</Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl font-bold">
                    <DropdownMenuItem onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="gap-2"><Edit3 className="h-4 w-4" /> تعديل</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/statement`)} className="gap-2"><FileText className="h-4 w-4" /> كشف حساب</DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { if(confirm("حذف؟")) await deleteDoc(doc(db!, "clients", client.id)) }} className="text-rose-600 gap-2"><Trash2 className="h-4 w-4" /> حذف</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <Phone className="h-4 w-4 text-primary" /> <span dir="ltr">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <Mail className="h-4 w-4 text-primary" /> {client.email}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black">الرصيد المتبقي</p>
                    <p className={`text-xl font-black ${balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                      {balance.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${client.id}/statement`)} className="rounded-xl font-black">كشف الحساب</Button>
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
