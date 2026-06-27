"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Search, Eye, EyeOff, Loader2, ShieldCheck, Settings2, Lock, Unlock, Link2, CheckCircle2, Key, Users, Clock, UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/language-provider";

function UsersPermissionsContent() {
  const { t, dir, language } = useTranslation();
  const [allClients, setAllClients] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [provisionedUsers, setProvisionedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const availablePermissions = [
    { id: "p_projects", label: t('view_projects_perm') },
    { id: "p_support", label: t('support_perm') },
    { id: "p_finances", label: t('finances_perm') },
  ];

  useEffect(() => {
    if (profile?.role !== 'admin' && !loading) { router.push("/"); return; }
    if (!db) return;
    const unsubC = onSnapshot(collection(db, "clients"), (snap) => setAllClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubU = onSnapshot(collection(db, "users"), (snap) => setActiveUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubP = onSnapshot(collection(db, "users_provision"), (snap) => { setProvisionedUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); });
    return () => { unsubC(); unsubU(); unsubP(); };
  }, [profile, router, loading]);

  const handleGrantAccess = async () => {
    if (!db || !selectedClient || !tempPassword) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "users_provision", selectedClient.email.toLowerCase()), { name: selectedClient.name, email: selectedClient.email.toLowerCase(), phone: selectedClient.phone || "", clientId: selectedClient.id, role: "client", status: "active", tempPassword: tempPassword, permissions: ["p_projects", "p_support"], createdAt: new Date().toISOString() });
      toast({ title: t('login_success') }); setIsPasswordModalOpen(false); setTempPassword("");
    } catch (err) { toast({ title: "Error", variant: "destructive" }); } finally { setIsSubmitting(false); }
  };

  const handleUpdateUser = async () => {
    if (!db || !editingUser) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", editingUser.id), { name: editingUser.name, status: editingUser.status, permissions: editingUser.permissions, tempPassword: editingUser.tempPassword || "", clientId: editingUser.clientId || "" });
      toast({ title: t('login_success') }); setIsEditModalOpen(false);
    } catch (err) { toast({ title: "Error", variant: "destructive" }); } finally { setIsSubmitting(false); }
  };

  const filteredClients = useMemo(() => allClients.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)), [allClients, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir={dir}>
      <header className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border"><div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldCheck className="h-8 w-8" /></div><div><h1 className="text-2xl font-black text-slate-800">{t('portal_title')}</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('portal_subtitle')}</p></div></header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6"><CardTitle className="text-base font-black flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> {t('activate_clients')}</CardTitle><div className="relative mt-3"><Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} /><input placeholder={t('search')} className={`w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11 rounded-xl text-xs bg-white border outline-none px-4 font-bold`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></CardHeader>
          <CardContent className="p-4"><ScrollArea className="h-[600px]"><div className="space-y-3">{filteredClients.map(client => { const isActive = activeUsers.some(u => u.email === client.email); const isProvisioned = provisionedUsers.some(u => u.email === client.email); return <div key={client.id} className="p-4 rounded-2xl bg-white border flex flex-col gap-3 shadow-sm hover:border-primary/20 transition-all"><div className="overflow-hidden"><p className="font-black text-slate-800 text-xs truncate">{client.name}</p><p className="text-[9px] font-bold text-slate-400" dir="ltr">{client.phone}</p></div><Button size="sm" disabled={isActive || !client.email} onClick={() => { setSelectedClient(client); setIsPasswordModalOpen(true); }} className={`rounded-xl font-black h-10 text-[10px] w-full ${isActive ? 'bg-green-500' : isProvisioned ? 'bg-orange-500' : 'bg-primary'}`}>{isActive ? t('status_active') : isProvisioned ? t('pending_activation') : t('add')}</Button></div>; })}</div></ScrollArea></CardContent>
        </Card>
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2rem] bg-white overflow-hidden border"><CardHeader className="bg-primary p-5 text-white"><CardTitle className="text-lg font-black flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> {t('active_accounts')}</CardTitle></CardHeader>
            <CardContent className="p-0"><div className="divide-y divide-slate-50">{activeUsers.filter(u => u.role !== 'admin').map(user => (
              <div key={user.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">{user.name?.[0]}</div><div><div className="flex items-center gap-2"><p className="font-black text-slate-800 text-xs">{user.name}</p>{user.status === 'inactive' && <Badge variant="destructive" className="text-[8px] h-4">{t('inactive')}</Badge>}</div><p className="text-[9px] font-bold text-slate-400">{user.email}</p></div></div><div className="flex items-center gap-3"><div className="bg-slate-50 p-2 px-4 rounded-xl border flex items-center gap-4"><p className="font-black text-slate-800 tracking-widest text-sm">{showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}</p><Button variant="ghost" size="icon" onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} className="h-8 w-8 text-slate-400">{showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div><Button variant="outline" size="icon" onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }} className="h-10 w-10 rounded-xl border-slate-200 text-primary"><Settings2 className="h-5 w-5" /></Button></div></div>
            ))}</div></CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-sm" dir={dir}><div className="bg-primary p-6 text-white"><DialogHeader><DialogTitle className="font-black text-lg">{t('activate_clients')}</DialogTitle></DialogHeader></div><div className="p-6 space-y-4"><Label className="font-black text-xs text-slate-600">{t('temp_password')}</Label><Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="123456" className="rounded-xl h-14 text-center text-2xl font-black tracking-widest" /></div><DialogFooter className="p-6 bg-slate-50 border-t"><Button onClick={handleGrantAccess} className="w-full h-12 rounded-xl font-black gap-2 shadow-lg" disabled={isSubmitting || !tempPassword}>{isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('confirm')}</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-lg" dir={dir}><div className="bg-slate-900 p-8 text-white"><DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><Settings2 className="h-6 w-6 text-primary" /> {t('user_settings')}</DialogTitle></DialogHeader></div><ScrollArea className="max-h-[60vh]"><div className="p-8 space-y-8"><div className="space-y-2"><Label className="font-black text-slate-700">{t('client_name')}</Label><Input value={editingUser?.name || ""} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="rounded-2xl h-12 font-bold" /></div><div className="p-6 bg-slate-50 rounded-3xl border space-y-4"><div className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase">{t('password_label')}</h3></div><Input value={editingUser?.tempPassword || ""} onChange={(e) => setEditingUser({...editingUser, tempPassword: e.target.value})} className="rounded-xl h-10 font-black text-center tracking-widest" /></div><div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between"><div><p className="font-black text-slate-800">{t('account_status')}</p></div><Switch checked={editingUser?.status === 'active'} onCheckedChange={(checked) => setEditingUser({...editingUser, status: checked ? 'active' : 'inactive'})} /></div><div className="space-y-4"><h3 className="font-black text-slate-800 text-sm uppercase">{t('available_permissions')}</h3><div className="grid grid-cols-2 gap-4">{availablePermissions.map((perm) => (<div key={perm.id} onClick={() => { const c = editingUser?.permissions || []; setEditingUser({...editingUser, permissions: c.includes(perm.id) ? c.filter((p:any)=>p!==perm.id) : [...c, perm.id]}); }} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer ${editingUser?.permissions?.includes(perm.id) ? 'bg-primary/5 border-primary' : 'bg-white border-slate-100'}`}><Checkbox checked={editingUser?.permissions?.includes(perm.id)} /><span className="font-black text-sm">{perm.label}</span></div>))}</div></div></div></ScrollArea><DialogFooter className="p-8 bg-slate-50 border-t"><Button onClick={handleUpdateUser} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl">{isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} {t('save')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPermissionsPage() { return <Suspense fallback={<Loader2 className="animate-spin" />}><UsersPermissionsContent /></Suspense>; }
