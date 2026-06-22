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
      toast({ title: "تم التنشيط" });
      setIsPasswordModalOpen(false);
      setTempPassword("");
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeUsersToDisplay = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    let users = activeUsers;
    if (s) users = users.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    if (roleFilter) return users.filter(u => u.role === roleFilter);
    return users.filter(u => u.role !== 'admin');
  }, [activeUsers, roleFilter, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldCheck className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">بوابة المستفيدين</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase">إدارة حسابات الدخول والصلاحيات</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-base font-black">تفعيل مستخدمين جدد</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input placeholder="بحث بالاسم..." className="w-full pr-10 h-11 rounded-xl text-xs bg-white border outline-none px-4" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {allClients.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(client => {
                  const isActive = activeUsers.some(u => u.email === client.email);
                  return (
                    <div key={client.id} className="p-4 rounded-2xl bg-white border flex flex-col gap-3 shadow-sm">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-xs truncate">{client.name}</p>
                        <p className="text-[9px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                      </div>
                      <Button size="sm" disabled={isActive || !client.email} onClick={() => { setSelectedClient(client); setIsPasswordModalOpen(true); }} className="rounded-lg font-black h-9 text-[10px] w-full">
                        {isActive ? 'نشط' : 'تفعيل الدخول'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-primary p-5 text-primary-foreground">
            <CardTitle className="text-lg font-black">الحسابات المسجلة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsersToDisplay.map(user => (
                <div key={user.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">{user.name?.[0]}</div>
                    <div>
                      <p className="font-black text-slate-800 text-xs">{user.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-primary">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="font-black text-base">تفعيل حساب {selectedClient?.name}</DialogTitle></DialogHeader>
          <div className="p-4 space-y-4">
            <Label className="font-black text-xs">كلمة المرور المؤقتة</Label>
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
