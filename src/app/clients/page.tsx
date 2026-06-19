
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  CreditCard, 
  MoreVertical, 
  Trash2, 
  Edit, 
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AddClientModal, ClientData } from '@/components/modals/add-client-modal';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'clients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
      setFilteredClients(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleSaveClient = async (data: ClientData) => {
    setIsSaving(true);
    try {
      if (data.id) {
        await updateDoc(doc(db, 'clients', data.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات العميل بنجاح.' });
      } else {
        await addDoc(collection(db, 'clients'), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast({ title: 'تمت الإضافة', description: 'تم إضافة العميل الجديد للنظام.' });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حفظ البيانات.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف كافة بياناته المالية.')) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
      toast({ title: 'تم الحذف', description: 'تم إزالة العميل من النظام.' });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حذف العميل.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> قائمة العملاء
          </h1>
          <p className="text-muted-foreground font-bold">إدارة بيانات العملاء والربط المالي</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="rounded-2xl font-black h-14 px-8 text-lg shadow-lg">
          <Plus className="ml-2 h-6 w-6" /> إضافة عميل جديد
        </Button>
      </header>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="ابحث بالاسم، رقم الهاتف، أو اسم المشروع..." 
              className="pr-12 h-14 rounded-2xl border-slate-200 font-bold text-lg focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const balance = (client.totalInvoices || 0) - (client.totalPayments || 0);
            return (
              <Card key={client.id} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all group overflow-hidden bg-white">
                <div className="bg-slate-50 p-6 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Users className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-800">{client.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{client.projectName || 'بدون مشروع نشط'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                        <MoreVertical className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" dir="rtl" className="font-bold rounded-xl border-none shadow-2xl p-2 min-w-[180px]">
                      <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/statement`)} className="gap-3 py-3 cursor-pointer rounded-lg hover:bg-slate-50">
                        <FileText className="h-4 w-4 text-primary" /> كشف حساب تفصيلي
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="gap-3 py-3 cursor-pointer rounded-lg hover:bg-blue-50 text-blue-600">
                        <Edit className="h-4 w-4" /> تعديل البيانات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="gap-3 py-3 cursor-pointer rounded-lg hover:bg-rose-50 text-rose-600">
                        <Trash2 className="h-4 w-4" /> حذف العميل
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600 font-bold">
                      <Phone className="h-4 w-4 text-primary" /> <span dir="ltr">{client.phone || 'غير مسجل'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 font-bold">
                      <Mail className="h-4 w-4 text-primary" /> {client.email || 'بدون بريد'}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase mb-1">الرصيد المتبقي</p>
                      <p className={`text-2xl font-black ${balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                        {balance.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${client.id}/statement`)} className="rounded-xl font-black border-2 border-sidebar-border hover:bg-primary hover:text-white transition-all">
                      التفاصيل <CreditCard className="mr-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-dashed border-slate-200">
          <Users className="h-16 w-16 mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-black text-slate-400">لم يتم العثور على نتائج للبحث</h3>
        </div>
      )}

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient} 
        isLoading={isSaving} 
        initialData={editingClient} 
      />
    </div>
  );
}
