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
  Users
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
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role');

  const availablePermissions = [
    { id: "p_projects", label: "عرض المشاريع" },
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
        permissions: ["p_projects", "p_support"],
        createdAt: new Date().toISOString()
      });
      
      toast({ title: "تم التفعيل", description: "تم تزويد العميل بصلاحيات الدخول بنجاح." });
      setIsPasswordModalOpen(false);
      setTempPassword("");
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تفعيل العميل.", variant: "destructive" });
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
        name: editingUser.name,
        clientId: editingUser.clientId,
        tempPassword: editingUser.tempPassword || ""
      });
      
      toast({ title: "تم التحديث", description: "تم تعديل صلاحيات وبيانات المستخدم بنجاح." });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ 
        title: "فشل في التحديث", 
        description: "تأكد من صلاحيات النظام وحاول مرة أخرى.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
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

  const activeUsersToDisplay = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    let users = activeUsers;

    if (s) {
      users = users.filter(u => 
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s)
      );
    }
    
    if (roleFilter) {
      return users.filter(u => u.role === roleFilter);
    }

    return users.filter(u => u.role !== 'admin');
  }, [activeUsers, roleFilter, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل البيانات...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex items-center gap-4 bg-white p-8 rounded-[2rem] shadow-sm border">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">بوابة المستفيدين</h1>
          <p className="text-slate-500 font-bold">إدارة حسابات الدخول والتحكم في الصلاحيات</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-lg font-black mb-4">
              تفعيل مستخدمين جدد
            </CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                placeholder="ابحث بالاسم أو الهاتف..."
                className="w-full pr-10 h-12 rounded-2xl font-bold bg-white border outline-none px-4 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredClients.map(client => {
                  const isActive = activeUsers.some(u => u.email === client.email);
                  return (
                    <div key={client.id} className="p-4 rounded-3xl bg-white border flex flex-col gap-3 shadow-sm">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm truncate">{client.name}</p>
                        <p className="text-[10px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isActive || !client.email}
                        onClick={() => { setSelectedClient(client); setIsPasswordModalOpen(true); }} 
                        className="rounded-xl font-black h-10 w-full"
                      >
                        {isActive ? 'نشط حالياً' : 'تفعيل الدخول'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-primary p-6 text-primary-foreground">
            <CardTitle className="text-xl font-black">الحسابات المسجلة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsersToDisplay.map(user => (
                <div key={user.id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }} className="h-9 w-9 rounded-xl border-slate-200 text-primary">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* مودال كلمات المرور والإعدادات */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">تفعيل حساب {selectedClient?.name}</DialogTitle></DialogHeader>
          <div className="p-4 space-y-4">
            <Label className="font-black">كلمة المرور المؤقتة</Label>
            <Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} className="rounded-xl h-12 text-center text-xl font-black tracking-widest" />
          </div>
          <DialogFooter><Button onClick={handleConfirmGrantAccess} className="w-full h-12 rounded-xl font-black" disabled={isSubmitting || !tempPassword}>تأكيد التفعيل</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPermissionsPage() {
  return <Suspense fallback={<Loader2 className="animate-spin" />}><UsersPermissionsContent /></Suspense>;
}
