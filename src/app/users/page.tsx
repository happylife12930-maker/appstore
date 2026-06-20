"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  BadgeCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Trash2,
  UserPlus,
  ShieldCheck,
  Key,
  Users,
  Clock,
  X
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
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
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
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
    setIsSubmitting(true);
    try {
      const emailLower = selectedClient.email.toLowerCase().trim();
      await setDoc(doc(db, "users_provision", emailLower), {
        name: selectedClient.name,
        email: emailLower,
        phone: selectedClient.phone || "",
        clientId: selectedClient.id, // استخدام معرف وثيقة العميل للربط مع المشاريع
        role: "client",
        status: "active",
        tempPassword: tempPassword,
        permissions: ["p_projects"],
        createdAt: new Date().toISOString()
      });
      
      toast({ title: "تم التفعيل", description: "يمكن للعميل الدخول الآن ببياناته." });
      setIsPasswordModalOpen(false);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تفعيل العميل.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (id: string, email: string) => {
    if (!db || !confirm("هل تريد سحب صلاحية الدخول؟")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      await deleteDoc(doc(db, "users_provision", email.toLowerCase()));
      toast({ title: "تم السحب", description: "تم إلغاء حساب العميل بنجاح." });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
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
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل البيانات...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <ShieldCheck className="h-12 w-12 text-primary" />
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">بوابة المستفيدين</h1>
          <p className="text-slate-500 font-bold">إدارة حسابات الدخول ومنح الصلاحيات</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-lg font-black mb-4">منح صلاحية دخول</CardTitle>
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
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredClients.map(client => {
                  const isActive = activeUsers.some(u => u.email === client.email);
                  const isProvisioned = provisionedUsers.some(u => u.email === client.email);
                  
                  return (
                    <div key={client.id} className="p-4 rounded-3xl bg-white border flex justify-between items-center shadow-sm">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm truncate">{client.name}</p>
                        <p className="text-[10px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isActive || !client.email}
                        onClick={() => { setSelectedClient(client); setTempPassword(""); setIsPasswordModalOpen(true); }} 
                        className={`rounded-xl font-black gap-2 h-9 px-4 ${isActive ? 'bg-green-500' : isProvisioned ? 'bg-amber-500' : 'bg-primary'}`}
                      >
                        {isActive ? 'نشط' : isProvisioned ? 'جاهز' : 'تفعيل'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border">
          <CardHeader className="bg-primary p-8 text-primary-foreground">
            <CardTitle className="text-2xl font-black flex items-center gap-3">الحسابات النشطة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsers.filter(u => u.role === 'client').map(user => (
                <div key={user.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-xl uppercase">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{user.name}</p>
                      <p className="text-xs font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 px-6 rounded-2xl border flex items-center gap-4 shadow-inner">
                      <p className="font-black text-slate-800 tracking-widest">
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRevokeAccess(user.id, user.email)} 
                      className="text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md" dir="rtl">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">منح صلاحية الدخول</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-bold mt-2">
                حدد كلمة المرور للعميل ({selectedClient?.name})
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">كلمة المرور المؤقتة</label>
              <Input 
                type="text" 
                placeholder="أدخل كلمة مرور..." 
                className="rounded-2xl h-14 font-black"
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
              تفعيل الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}