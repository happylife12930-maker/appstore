
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Search, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck,
  Settings2,
  Lock,
  Unlock,
  Link2,
  CheckCircle2,
  Key,
  Users,
  Clock,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";

function UsersPermissionsContent() {
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
    { id: "p_projects", label: "عرض المشاريع" },
    { id: "p_support", label: "الدعم الفني" },
    { id: "p_finances", label: "البيانات المالية" },
  ];

  useEffect(() => {
    if (profile?.role !== 'admin' && !loading) {
      router.push("/");
      return;
    }
    if (!db) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setAllClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setActiveUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProvision = onSnapshot(collection(db, "users_provision"), (snap) => {
      setProvisionedUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubUsers();
      unsubProvision();
    };
  }, [profile, router, loading]);

  const handleConfirmGrantAccess = async () => {
    if (!db || !selectedClient || !tempPassword) return;
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
      toast({ title: "تم تجهيز الحساب", description: "يمكن للعميل الدخول الآن بالباسورد الذي حددته." });
      setIsPasswordModalOpen(false);
      setTempPassword("");
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!db || !editingUser) return;
    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        name: editingUser.name,
        status: editingUser.status,
        permissions: editingUser.permissions,
        tempPassword: editingUser.tempPassword || "",
        clientId: editingUser.clientId || ""
      });
      toast({ title: "تم التحديث بنجاح" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ title: "فشل التحديث", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return allClients.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.phone?.includes(searchQuery)
    );
  }, [allClients, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">جاري تحميل البوابة...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldCheck className="h-8 w-8" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">بوابة المستفيدين والصلاحيات</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">إدارة الدخول، كلمات المرور، وحالة الحسابات</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* قائمة العملاء للتفعيل */}
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> تفعيل عملاء جدد
            </CardTitle>
            <div className="relative mt-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                placeholder="ابحث بالاسم لتنشيط الدخول..." 
                className="w-full pr-10 h-11 rounded-xl text-xs bg-white border outline-none px-4 font-bold" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredClients.map(client => {
                  const isActive = activeUsers.some(u => u.email === client.email);
                  const isProvisioned = provisionedUsers.some(u => u.email === client.email);
                  
                  return (
                    <div key={client.id} className="p-4 rounded-2xl bg-white border flex flex-col gap-3 shadow-sm hover:border-primary/20 transition-all">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-xs truncate">{client.name}</p>
                        <p className="text-[9px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isActive || !client.email} 
                        onClick={() => { setSelectedClient(client); setIsPasswordModalOpen(true); }} 
                        className={`rounded-xl font-black h-10 text-[10px] w-full transition-all ${
                          isActive ? 'bg-green-500 hover:bg-green-600' : 
                          isProvisioned ? 'bg-orange-500 hover:bg-orange-600 shadow-md' : 'bg-primary'
                        }`}
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> نشط تماماً</span>
                        ) : isProvisioned ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> في انتظار الدخول</span>
                        ) : 'بدء تفعيل الدخول'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* الحسابات النشطة وقيد التفعيل */}
        <div className="lg:col-span-8 space-y-6">
          {/* حسابات قيد التفعيل */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border border-orange-100">
            <CardHeader className="bg-orange-500 p-5 text-white">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Clock className="h-5 w-5" /> حسابات قيد التفعيل (لم يدخلوا بعد)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {provisionedUsers.map(user => (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-orange-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs uppercase">
                        {user.name?.[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-xs">{user.name}</p>
                        <p className="text-[9px] font-bold text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2 px-4 rounded-xl border border-orange-100 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-orange-500 uppercase">كلمة المرور المؤقتة</p>
                          <p className="font-black text-slate-800 tracking-widest text-sm">
                            {showPasswords[user.email] ? user.tempPassword : '••••••••'}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} 
                          className="h-8 w-8 rounded-lg text-slate-400"
                        >
                          {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {provisionedUsers.length === 0 && (
                  <div className="p-10 text-center opacity-30">
                    <Clock className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-black text-xs">لا توجد حسابات معلقة حالياً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* الحسابات المسجلة فعلياً */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
            <CardHeader className="bg-primary p-5 text-primary-foreground">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> الحسابات المسجلة والنشطة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {activeUsers.filter(u => u.role !== 'admin').map(user => (
                  <div key={user.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">
                        {user.name?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 text-xs">{user.name}</p>
                          {user.status === 'inactive' && <Badge variant="destructive" className="text-[8px] h-4">معطل</Badge>}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* عرض الباسورد للحسابات المسجلة أيضاً */}
                      <div className="bg-slate-50 p-2 px-4 rounded-xl border flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">كلمة المرور الحالية</p>
                          <p className="font-black text-slate-800 tracking-widest text-xs">
                            {showPasswords[user.email] ? user.tempPassword || 'غير مسجلة' : '••••••••'}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} 
                          className="h-8 w-8 rounded-lg text-slate-400"
                        >
                          {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                        className="h-10 w-10 rounded-xl border-slate-200 text-primary hover:bg-primary/5 shadow-sm"
                      >
                        <Settings2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {activeUsers.filter(u => u.role !== 'admin').length === 0 && (
                  <div className="p-10 text-center opacity-30">
                    <Users className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-black text-xs">لا توجد حسابات مسجلة بعد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مودال تفعيل الدخول (باسورد مؤقت) */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-sm" dir="rtl">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="font-black text-lg">تفعيل حساب المستفيد</DialogTitle>
              <DialogDescription className="text-white/80 text-xs font-bold mt-1">حدد كلمة مرور ليدخل بها {selectedClient?.name}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <Label className="font-black text-xs text-slate-600">كلمة المرور المؤقتة</Label>
            <Input 
              value={tempPassword} 
              onChange={e => setTempPassword(e.target.value)} 
              placeholder="مثلاً: 123456"
              className="rounded-xl h-14 text-center text-2xl font-black tracking-widest border-2 border-primary/20" 
            />
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button onClick={handleConfirmGrantAccess} className="w-full h-12 rounded-xl font-black gap-2 shadow-lg" disabled={isSubmitting || !tempPassword}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأكيد وتفعيل الصلاحية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال تعديل الصلاحيات والحالة وكلمة المرور */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-lg" dir="rtl">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <Settings2 className="h-6 w-6 text-primary" /> إعدادات حساب المستخدم
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2">اسم المستخدم</Label>
                <Input 
                  value={editingUser?.name || ""} 
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="rounded-2xl h-12 font-bold"
                />
              </div>

              {/* قسم تعديل كلمة المرور */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Key className="h-5 w-5 text-primary" />
                  <h3 className="font-black text-sm uppercase">كلمة المرور</h3>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-600 text-xs">تغيير الباسورد</Label>
                  <Input 
                    value={editingUser?.tempPassword || ""} 
                    onChange={(e) => setEditingUser({...editingUser, tempPassword: e.target.value})}
                    placeholder="أدخل كلمة مرور جديدة..."
                    className="rounded-xl h-10 font-black text-center tracking-widest border-slate-200"
                  />
                  <p className="text-[9px] font-bold text-slate-400 pr-2">ملاحظة: سيتمكن المستخدم من الدخول بهذا الرمز فوراً.</p>
                </div>
              </div>

              {/* قسم تعديل الربط التقني */}
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Link2 className="h-5 w-5" />
                  <h3 className="font-black text-sm uppercase">بيانات الربط التقني</h3>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-600 text-xs">معرف العميل (clientId)</Label>
                  <Input 
                    value={editingUser?.clientId || ""} 
                    onChange={(e) => setEditingUser({...editingUser, clientId: e.target.value})}
                    placeholder="أدخل معرف العميل للربط..."
                    className="rounded-xl h-10 font-mono text-xs border-primary/20 bg-white"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${editingUser?.status === 'active' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {editingUser?.status === 'active' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800">حالة الحساب</p>
                    <p className="text-[10px] font-bold text-slate-400">تحكم في نشاط المستخدم</p>
                  </div>
                </div>
                <Switch 
                  checked={editingUser?.status === 'active'}
                  onCheckedChange={(checked) => setEditingUser({...editingUser, status: checked ? 'active' : 'inactive'})}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2 text-sm uppercase">صلاحيات المستفيد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availablePermissions.map((perm) => (
                    <div 
                      key={perm.id} 
                      onClick={() => {
                        const current = editingUser?.permissions || [];
                        const next = current.includes(perm.id) ? current.filter((p:any)=>p!==perm.id) : [...current, perm.id];
                        setEditingUser({...editingUser, permissions: next});
                      }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        editingUser?.permissions?.includes(perm.id) 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <Checkbox 
                        checked={editingUser?.permissions?.includes(perm.id)} 
                        className="rounded-md h-5 w-5"
                      />
                      <span className={`font-black text-sm ${editingUser?.permissions?.includes(perm.id) ? 'text-primary' : 'text-slate-600'}`}>
                        {perm.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button 
              onClick={handleUpdateUser} 
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              حفظ كافة التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPermissionsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><UsersPermissionsContent /></Suspense>;
}
