"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Search, Eye, EyeOff, Loader2, ShieldCheck, Settings2, Lock, Unlock, Link2, CheckCircle2, Key, Users, Clock, UserPlus, Trash2, ShieldAlert, Plus
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
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
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
    if (!selectedClient.email) {
      toast({ title: "خطأ", description: "العميل لا يملك بريداً إلكترونياً.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const emailLower = selectedClient.email.toLowerCase().trim();
      await setDoc(doc(db, "users_provision", emailLower), { 
        name: selectedClient.name, 
        email: emailLower, 
        phone: selectedClient.phone || "", 
        clientId: selectedClient.id, 
        role: "client", 
        status: "active", 
        tempPassword: tempPassword, 
        permissions: ["p_projects", "p_support"], 
        createdAt: new Date().toISOString() 
      });
      toast({ title: t('login_success') }); 
      setIsPasswordModalOpen(false); 
      setTempPassword("");
    } catch (err) { 
      toast({ title: "Error", variant: "destructive" }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleCreateAdmin = async () => {
    if (!db || !adminName || !adminEmail || !tempPassword) return;
    setIsSubmitting(true);
    try {
      const emailLower = adminEmail.toLowerCase().trim();
      await setDoc(doc(db, "users_provision", emailLower), { 
        name: adminName, 
        email: emailLower, 
        role: "admin", 
        status: "active", 
        tempPassword: tempPassword, 
        permissions: ["p_projects", "p_support", "p_finances", "p_clients", "p_testers"], 
        createdAt: new Date().toISOString() 
      });
      toast({ title: "تم تجهيز حساب المسؤول", description: "يمكن للمسؤول الجديد الدخول الآن." }); 
      setIsAdminCreateModalOpen(false);
      setAdminName("");
      setAdminEmail("");
      setTempPassword("");
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!db || !editingUser) return;
    setIsSubmitting(true);
    try {
      const collectionName = editingUser.isProvision ? "users_provision" : "users";
      await updateDoc(doc(db, collectionName, editingUser.id), { 
        name: editingUser.name, 
        status: editingUser.status, 
        permissions: editingUser.permissions, 
        tempPassword: editingUser.tempPassword || "", 
        clientId: editingUser.clientId || "" 
      });
      toast({ title: t('login_success'), description: "تم تحديث البيانات بنجاح" }); 
      setIsEditModalOpen(false);
    } catch (err) { 
      toast({ title: "Error", variant: "destructive" }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDeleteUser = async (userId: string, isProvision?: boolean) => {
    if (!db || !confirm(t('delete') + "?")) return;
    try {
      const collectionName = isProvision ? "users_provision" : "users";
      await deleteDoc(doc(db, collectionName, userId));
      toast({ title: t('delete') });
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filteredClients = useMemo(() => allClients.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)), [allClients, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldCheck className="h-8 w-8" /></div>
          <div><h1 className="text-2xl font-black text-slate-800">{t('portal_title')}</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('portal_subtitle')}</p></div>
        </div>
        <Button onClick={() => setIsAdminCreateModalOpen(true)} className="rounded-xl h-12 px-6 font-black gap-2 bg-slate-900 text-white shadow-lg active:scale-95 transition-all">
          <ShieldAlert className="h-5 w-5" /> {t('add_admin')}
        </Button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-base font-black flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> {t('activate_clients')}</CardTitle>
            <div className="relative mt-3">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} />
              <input placeholder={t('search')} className={`w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11 rounded-xl text-xs bg-white border outline-none px-4 font-bold`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredClients.map(client => { 
                  const clientEmail = client.email?.toLowerCase().trim() || "no-email";
                  const activeUser = activeUsers.find(u => u.email?.toLowerCase().trim() === clientEmail);
                  const isActive = !!activeUser;
                  
                  const provisionUser = provisionedUsers.find(u => u.email?.toLowerCase().trim() === clientEmail);
                  const isProvisioned = !!provisionUser; 
                  
                  return (
                    <div key={client.id} className="p-4 rounded-2xl bg-white border flex flex-col gap-3 shadow-sm hover:border-primary/20 transition-all">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-xs truncate">{client.name}</p>
                        <p className="text-[9px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => { 
                          if (isActive) {
                            setEditingUser({ ...activeUser, isProvision: false });
                            setIsEditModalOpen(true);
                          } else if (isProvisioned) {
                            setEditingUser({ ...provisionUser, isProvision: true });
                            setIsEditModalOpen(true);
                          } else {
                            setSelectedClient(client); 
                            setTempPassword("");
                            setIsPasswordModalOpen(true); 
                          }
                        }} 
                        className={`rounded-xl font-black h-10 text-[10px] w-full transition-all ${isActive ? 'bg-green-500 hover:bg-green-600' : isProvisioned ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary'}`}
                      >
                        {isActive ? (
                          <div className="flex items-center gap-1"><Settings2 className="h-3 w-3" /> {t('user_settings')}</div>
                        ) : isProvisioned ? (
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('pending_activation')} (تعديل)</div>
                        ) : t('add')}
                      </Button>
                    </div>
                  ); 
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2rem] bg-white overflow-hidden border">
            <CardHeader className="bg-primary p-5 text-white">
              <CardTitle className="text-lg font-black flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> {t('active_accounts')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {[...activeUsers, ...provisionedUsers].map((user, idx) => {
                  if (user.uid === profile?.uid) return null; // لا يظهر الأدمن الحالي لنفسه
                  const isProvision = !user.uid;
                  return (
                    <div key={user.id || idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${user.role === 'admin' ? 'bg-slate-900 text-white' : isProvision ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                          {user.name?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-xs">{user.name}</p>
                            {user.role === 'admin' && <Badge className="bg-slate-900 text-white text-[7px] h-4 font-black">أدمن</Badge>}
                            {isProvision ? (
                              <Badge variant="outline" className="text-[8px] h-4 border-orange-200 text-orange-600">{t('pending_activation')}</Badge>
                            ) : (
                              user.status === 'inactive' && <Badge variant="destructive" className="text-[8px] h-4">{t('inactive')}</Badge>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="bg-slate-50 p-2 px-4 rounded-xl border flex items-center gap-4 flex-1 sm:flex-none">
                          <p className="font-black text-slate-800 tracking-widest text-sm">{showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}</p>
                          <Button variant="ghost" size="icon" onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} className="h-8 w-8 text-slate-400">
                            {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => { setEditingUser({...user, isProvision}); setIsEditModalOpen(true); }} 
                            className="h-10 w-10 rounded-xl border-slate-200 text-primary hover:bg-primary/5"
                          >
                            <Settings2 className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteUser(user.id, isProvision)} 
                            className="h-10 w-10 rounded-xl text-rose-300 hover:text-rose-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مودال إنشاء أدمن جديد */}
      <Dialog open={isAdminCreateModalOpen} onOpenChange={setIsAdminCreateModalOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-sm:max-w-[90vw] sm:max-w-md" dir={dir}>
          <div className="bg-slate-900 p-6 text-white"><DialogHeader><DialogTitle className="font-black text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> {t('add_admin')}</DialogTitle></DialogHeader></div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="font-black text-[10px] text-slate-500 uppercase">{t('admin_name')}</Label>
              <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="الاسم الكامل للمسؤول" className="rounded-xl h-11 font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-black text-[10px] text-slate-500 uppercase">{t('email_label')}</Label>
              <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@appstore.com" className="rounded-xl h-11 font-bold" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-black text-[10px] text-slate-500 uppercase">{t('temp_password')}</Label>
              <Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="123456" className="rounded-xl h-11 text-center font-black tracking-widest text-lg" />
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button onClick={handleCreateAdmin} className="w-full h-12 rounded-xl font-black gap-2 shadow-lg bg-slate-900 hover:bg-black" disabled={isSubmitting || !adminName || !adminEmail || !tempPassword}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} إنشاء حساب المسؤول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-sm:max-w-[90vw] sm:max-w-sm" dir={dir}>
          <div className="bg-primary p-6 text-white"><DialogHeader><DialogTitle className="font-black text-lg">{t('activate_clients')}</DialogTitle></DialogHeader></div>
          <div className="p-6 space-y-4">
            <Label className="font-black text-xs text-slate-600">{t('temp_password')}</Label>
            <Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="123456" className="rounded-xl h-14 text-center text-2xl font-black tracking-widest" />
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button onClick={handleGrantAccess} className="w-full h-12 rounded-xl font-black gap-2 shadow-lg" disabled={isSubmitting || !tempPassword}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-lg:max-w-[95vw] lg:max-w-lg" dir={dir}>
          <div className="bg-slate-900 p-8 text-white"><DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><Settings2 className="h-6 w-6 text-primary" /> {t('user_settings')}</DialogTitle></DialogHeader></div>
          <ScrollArea className="max-h-[65vh]">
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="font-black text-slate-700">{t('client_name')}</Label>
                <Input value={editingUser?.name || ""} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="rounded-2xl h-12 font-bold" />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
                <div className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase">{t('password_label')}</h3></div>
                <Input value={editingUser?.tempPassword || ""} onChange={(e) => setEditingUser({...editingUser, tempPassword: e.target.value})} className="rounded-xl h-10 font-black text-center tracking-widest" />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                <div><p className="font-black text-slate-800">{t('account_status')}</p></div>
                <Switch checked={editingUser?.status === 'active'} onCheckedChange={(checked) => setEditingUser({...editingUser, status: checked ? 'active' : 'inactive'})} />
              </div>
              {editingUser?.role === 'client' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase">{t('available_permissions')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availablePermissions.map((perm) => (
                      <div 
                        key={perm.id} 
                        onClick={() => { 
                          const c = editingUser?.permissions || []; 
                          setEditingUser({...editingUser, permissions: c.includes(perm.id) ? c.filter((p:any)=>p!==perm.id) : [...c, perm.id]}); 
                        }} 
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${editingUser?.permissions?.includes(perm.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-100'}`}
                      >
                        <Checkbox checked={editingUser?.permissions?.includes(perm.id)} />
                        <span className="font-black text-sm">{perm.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button onClick={handleUpdateUser} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPermissionsPage() { return <Suspense fallback={<Loader2 className="animate-spin" />}><UsersPermissionsContent /></Suspense>; }
