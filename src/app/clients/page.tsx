
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Users, Search, Plus, Phone, Mail, Trash2, Edit3, Loader2, Lock, Building
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
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/language-provider";

const normalizeText = (text: string) => {
  if (!text) return '';
  const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(text).toLowerCase().trim();
};

function ClientsContent() {
  const { t, dir, language } = useTranslation();
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
  const hasClientPermission = isAdmin && (profile?.permissions || []).includes('p_clients');

  useEffect(() => {
    if (authLoading) return;
    if (!hasClientPermission) {
      setLoading(false);
      return;
    }
    if (!db) return;
    
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
      setLoading(false);
    }, (err) => {
      console.error("Clients Listener Error:", err);
      setLoading(false);
    });

    return () => unsubClients();
  }, [hasClientPermission, authLoading]);

  const filteredClients = useMemo(() => {
    const s = normalizeText(searchQuery);
    if (!s) return clients;
    return clients.filter(c => 
      normalizeText(c.name).includes(s) || 
      normalizeText(c.phone).includes(s) || 
      normalizeText(c.phone2 || "").includes(s) || 
      normalizeText(c.company || "").includes(s)
    );
  }, [clients, searchQuery]);

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  if (!hasClientPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-slate-200" />
        <h2 className="text-xl font-black text-slate-800">{t('access_restricted')}</h2>
        <Button onClick={() => router.push("/")} className="mt-4 rounded-xl h-10 px-6 font-black">{t('back')}</Button>
      </div>
    );
  }

  const handleSaveClient = async (data: ClientData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "clients", data.id), data);
        toast({ title: t('login_success') });
      } else {
        await addDoc(collection(db, "clients"), data);
        toast({ title: t('login_success') });
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!db || !confirm(t('delete') + "?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: t('delete') });
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t('clients_title')}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('clients_subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="rounded-xl h-11 px-6 font-black text-sm gap-2 shadow-md">
          <Plus className="h-5 w-5" /> {t('add_client')}
        </Button>
      </header>

      <div className="relative">
        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} />
        <Input 
          placeholder={t('search_clients')} 
          className={`${dir === 'rtl' ? 'pr-12' : 'pl-12'} h-14 rounded-xl font-bold border-none shadow-sm bg-white text-sm`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group border border-slate-50">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-sm">{client.name?.[0]}</div>
                <div className="overflow-hidden">
                  <CardTitle className="text-sm font-black truncate max-w-[150px] text-slate-800">{client.name}</CardTitle>
                  <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Building className="h-2 w-2" /> {client.company || '---'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-primary/5 hover:text-primary"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id!)} className="h-8 w-8 rounded-lg text-rose-300 hover:text-rose-50"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('phone_numbers')}</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-2" dir="ltr"><Phone className="h-3 w-3 text-primary" /> {client.phone}</span>
                    <Badge variant="outline" className="text-[8px] h-4 font-black">{t('primary_phone')}</Badge>
                  </div>
                  {client.phone2 && (
                    <div className="flex items-center justify-between bg-slate-50/50 p-2 px-3 rounded-xl border border-dashed border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2" dir="ltr"><Phone className="h-3 w-3" /> {client.phone2}</span>
                      <Badge variant="ghost" className="text-[8px] h-4 font-black opacity-50">{t('extra_phone')}</Badge>
                    </div>
                  )}
                  {client.email && (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2 px-1" dir="ltr"><Mail className="h-3 w-3" /> {client.email}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-between items-center">
                <div className="space-y-0.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase">{t('projects')}</p>
                   <p className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{client.projectName || '---'}</p>
                </div>
                <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{t('remaining_balance')}</p>
                  <span className={`font-black text-sm ${client.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    {(client.balance || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} <small className="text-[10px]">{language === 'ar' ? 'ج.م' : 'EGP'}</small>
                  </span>
                </div>
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
