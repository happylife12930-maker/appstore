"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Eye, 
  EyeOff, 
  Loader2, 
  Trash2,
  UserPlus,
  ShieldCheck,
  Users,
  CheckCircle2,
  Settings2,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function UsersPermissionsPage() {
  const [allClients, setAllClients] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [provisionedUsers, setProvisionedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Available Permissions
  const availablePermissions = [
    { id: "p_projects", label: "عرض المشاريع" },
    { id: "p_chat", label: "المحادثة المباشرة" },
    { id: "p_support", label: "الدعم الفني" },
    { id: "p_finances", label: "البيانات المالية" },
  ];

  useEffect(() => {
    if (profile?.role !== 'admin') {
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
  }, [profile, router]);

  const handleConfirmGrantAccess = async () => {
    if (!db || !selectedClient || !tempPassword) return;
    if (!selectedClient.email) {
      toast({ title: "خطأ", description: "العميل لا يملك بريداً إلكترونياً مسجلاً.", variant: "destructive" });
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
        permissions: ["p_projects"],
        createdAt: new Date().toISOString()
      });
      
      toast({ title: "تم التفعيل", description: "تم تزويد العميل بصلاحيات الدخول بنجاح." });
      setIsPasswordModalOpen(false);
      setTempPassword("");
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تفعيل العميل. تأكد من اتصال الإنترنت.", variant: "destructive" });
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
        status: editingUser.status,
        permissions: editingUser.permissions,
        name: editingUser.name
      });
      
      toast({ title: "تم التحديث", description: "تم تعديل صلاحيات وحالة المستخدم بنجاح." });
      setIsEditModalOpen(false);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحديث البيانات.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف الحساب النشط
  const handleRevokeActiveAccess = async (uid: string, email: string) => {
    if (!db) return;
    if (!confirm("تحذير: هل أنت متأكد من حذف حساب العميل نهائياً؟ سيتم منعه من الدخول فوراً.")) return;
    
    try {
      await deleteDoc(doc(db, "users", uid));
      if (email) {
        await deleteDoc(doc(db, "users_provision", email.toLowerCase().trim())).catch(() => {});
      }
      toast({ title: "تم الحذف", description: "تم إلغاء حساب العميل من النظام نهائياً." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل الحذف، يرجى التحقق من الصلاحيات.", variant: "destructive" });
    }
  };

  // إلغاء طلب التفعيل المعلق
  const handleCancelProvision = async (email: string) => {
    if (!db || !email) return;
    if (!confirm("هل تريد إلغاء طلب التفعيل لهذا العميل؟")) return;
    
    try {
      await deleteDoc(doc(db, "users_provision", email.toLowerCase().trim()));
      toast({ title: "تم الإلغاء", description: "تم سحب طلب التفعيل المعلق بنجاح." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل إلغاء الطلب.", variant: "destructive" });
    }
  };

  const togglePermission = (permId: string) => {
    if (!editingUser) return;
    const currentPerms = editingUser.permissions || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId];
    setEditingUser({ ...editingUser, permissions: newPerms });
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
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل البيانات...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">بوابة المستفيدين</h1>
          <p className="text-slate-500 font-bold">إدارة حسابات الدخول، التنشيط، وتعديل الصلاحيات</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* قائمة العملاء لتفعيلهم */}
        <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-lg font-black mb-4">تفعيل عملاء جدد</CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                placeholder="ابحث بالاسم أو الهاتف..." 
                className="w-full pr-10 h-12 rounded-2xl font-bold bg-white border outline-none px-4"
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
                  const provision = provisionedUsers.find(u => u.email === client.email);
                  
                  return (
                    <div key={client.id} className="p-4 rounded-3xl bg-white border flex flex-col gap-3 shadow-sm hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden">
                          <p className="font-black text-slate-800 text-sm truncate">{client.name}</p>
                          <p className="text-[10px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                        </div>
                        {provision && !isActive && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCancelProvision(client.email)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="إلغاء التفعيل المعلق"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isActive || !client.email}
                        onClick={() => { setSelectedClient(client); setTempPassword(""); setIsPasswordModalOpen(true); }} 
                        className={`rounded-xl font-black gap-2 h-10 px-4 w-full ${isActive ? 'bg-green-500 hover:bg-green-600' : provision ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary'}`}
                      >
                        {isActive ? 'نشط تماماً' : provision ? 'في انتظار الدخول' : 'بدء التفعيل'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* قائمة الحسابات النشطة */}
        <Card className="lg:col-span-8 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-primary p-8 text-primary-foreground">
            <CardTitle className="text-2xl font-black flex items-center gap-3">الحسابات النشطة حالياً</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsers.filter(u => u.role === 'client').map(user => (
                <div key={user.id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl uppercase ${user.status === 'inactive' ? 'bg-slate-200 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                      {user.name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800">{user.name}</p>
                        <Badge variant={user.status === 'inactive' ? 'destructive' : 'default'} className="rounded-lg text-[8px] font-black h-5">
                          {user.status === 'inactive' ? 'معطل' : 'نشط'}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-50 p-2 px-4 rounded-2xl border flex items-center gap-4 shadow-inner">
                      <p className="font-black text-slate-800 tracking-widest text-xs">
                        {showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} 
                        className="h-8 w-8 rounded-lg"
                      >
                        {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                        className="h-10 w-10 rounded-xl border-slate-200 text-primary hover:bg-primary/5"
                        title="تعديل الصلاحيات والحالة"
                      >
                        <Settings2 className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRevokeActiveAccess(user.id, user.email)} 
                        className="text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-xl"
                        title="حذف الحساب نهائياً"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {activeUsers.filter(u => u.role === 'client').length === 0 && (
                <div className="p-20 text-center opacity-40">
                  <Users className="h-16 w-16 mx-auto mb-4" />
                  <p className="font-black text-lg">لا توجد حسابات مستفيدين نشطة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md" dir="rtl">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">تفعيل حساب مستفيد</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-bold mt-2">
                حدد كلمة المرور التي سيدخل بها {selectedClient?.name}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">كلمة المرور المؤقتة</label>
              <Input 
                type="text" 
                placeholder="أدخل كلمة مرور..." 
                className="rounded-2xl h-14 font-black text-center text-xl tracking-widest"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleConfirmGrantAccess} 
              disabled={isSubmitting || !tempPassword}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              تأكيد ومنح الصلاحية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-lg" dir="rtl">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <Settings2 className="h-6 w-6 text-primary" /> إعدادات حساب المستفيد
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${editingUser?.status === 'active' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {editingUser?.status === 'active' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-black text-slate-800">حالة الحساب</p>
                  <p className="text-[10px] font-bold text-slate-400">تحكم في قدرة العميل على الدخول</p>
                </div>
              </div>
              <Switch 
                checked={editingUser?.status === 'active'}
                onCheckedChange={(checked) => setEditingUser({...editingUser, status: checked ? 'active' : 'inactive'})}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2 text-sm uppercase">الصلاحيات المتاحة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availablePermissions.map((perm) => (
                  <div 
                    key={perm.id} 
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      editingUser?.permissions?.includes(perm.id) 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <Checkbox 
                      checked={editingUser?.permissions?.includes(perm.id)} 
                      onCheckedChange={() => togglePermission(perm.id)}
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

          <DialogFooter className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleUpdateUser} 
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}