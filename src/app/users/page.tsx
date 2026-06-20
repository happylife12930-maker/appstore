
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
  ShieldAlert,
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
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

const normalizeText = (text: string) => {
  if (!text) return '';
  const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(text).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

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

  const openGrantModal = (client: any) => {
    if (!client.email) {
      toast({ 
        title: "بيانات ناقصة", 
        description: "العميل ليس له بريد إلكتروني مسجل. يرجى تعديله أولاً.", 
        variant: "destructive" 
      });
      return;
    }
    setSelectedClient(client);
    setTempPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleConfirmGrantAccess = async () => {
    if (!db || !selectedClient || !tempPassword) return;
    if (tempPassword.length < 4) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 4 رموز على الأقل.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "users_provision", selectedClient.email), {
        name: selectedClient.name,
        email: selectedClient.email,
        phone: selectedClient.phone || "",
        clientId: selectedClient.id, // ربط معرف العميل الأصلي
        role: "client",
        status: "active",
        tempPassword: tempPassword,
        permissions: ["p_projects"],
        createdAt: new Date().toISOString()
      });
      
      toast({ 
        title: "تم التفعيل", 
        description: `أصبح العميل (${selectedClient.name}) جاهزاً للدخول الآن.` 
      });
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      toast({ title: "فشل العملية", description: "حدث خطأ أثناء حفظ البيانات.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (id: string, email: string) => {
    if (!db) return;
    if (confirm("هل تريد سحب صلاحية الدخول نهائياً؟")) {
      try {
        await deleteDoc(doc(db, "users", id));
        await deleteDoc(doc(db, "users_provision", email));
        toast({ title: "تم السحب", description: "تم إلغاء حساب العميل بنجاح." });
      } catch (err) {
        toast({ title: "خطأ في السحب", variant: "destructive" });
      }
    }
  };

  const filteredClients = useMemo(() => {
    const s = normalizeText(searchQuery);
    if (!s) return allClients;
    return allClients.filter(c => 
      normalizeText(c.name).includes(s) || 
      normalizeText(c.phone || "").includes(s)
    );
  }, [allClients, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل بيانات البوابة...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="h-10 w-10 text-primary" /> بوابة المستفيدين
          </h1>
          <p className="text-slate-500 font-bold mt-2">إدارة حسابات الدخول ومنح الصلاحيات لعملاء الوكالة</p>
        </div>
        <div className="p-4 bg-primary/10 rounded-[2rem] hidden md:block">
          <Users className="h-12 w-12 text-primary" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-50">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-lg font-black mb-4">منح صلاحية دخول</CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                placeholder="ابحث بالاسم أو الهاتف..." 
                className="w-full pr-10 h-12 rounded-2xl font-bold bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all px-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-3">
                {filteredClients.map(client => {
                  const isActive = activeUsers.some(u => u.email === client.email);
                  const isProvisioned = provisionedUsers.some(u => u.email === client.email);
                  
                  return (
                    <div key={client.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex justify-between items-center shadow-sm hover:border-primary/20 transition-colors group">
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm truncate">{client.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate" dir="ltr">{client.phone || 'بدون هاتف'}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isActive || !client.email}
                        onClick={() => openGrantModal(client)} 
                        className={`rounded-xl font-black gap-2 h-9 px-4 transition-all ${
                          isActive 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : isProvisioned 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                          : 'bg-primary shadow-primary/10'
                        }`}
                      >
                        {isActive ? <BadgeCheck className="h-4 w-4" /> : isProvisioned ? <Clock className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        {isActive ? 'نشط' : isProvisioned ? 'جاهز' : 'تفعيل'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-50">
          <CardHeader className="bg-primary p-8 text-primary-foreground">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-accent" /> حسابات البوابة النشطة
            </CardTitle>
            <p className="text-primary-foreground/70 font-bold text-sm">تظهر هنا كافة حسابات العملاء الذين لديهم حق الدخول حالياً</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsers.filter(u => u.role === 'client').map(user => (
                <div key={user.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-2xl shadow-inner uppercase">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">{user.name}</p>
                      <p className="text-xs font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-slate-50 p-2 px-6 rounded-[1.5rem] border flex items-center gap-6 flex-1 sm:flex-initial shadow-inner">
                      <div className="text-center">
                        <Key className="h-3 w-3 text-slate-400 mx-auto mb-1" />
                        <p className="font-black text-slate-800 tracking-widest text-base">
                          {showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} 
                        className="h-10 w-10 rounded-xl hover:bg-white"
                      >
                        {showPasswords[user.email] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRevokeAccess(user.id, user.email)} 
                      className="text-rose-500 hover:bg-rose-50 h-12 w-12 rounded-2xl transition-all"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeUsers.filter(u => u.role === 'client').length === 0 && (
                <div className="py-24 text-center opacity-30 flex flex-col items-center gap-6">
                  <ShieldCheck className="h-24 w-24" />
                  <p className="font-black text-xl">لا توجد حسابات مفعلة حالياً لبوابة المستفيدين</p>
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
              <DialogTitle className="text-2xl font-black">منح صلاحية الدخول</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-bold mt-2">
                حدد كلمة المرور التي سيستخدمها العميل ({selectedClient?.name}) للدخول.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 pr-2">كلمة المرور المؤقتة</label>
              <div className="relative">
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="أدخل 4 رموز على الأقل..." 
                  className="rounded-2xl h-14 pr-12 font-black border-slate-200"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleConfirmGrantAccess} 
              disabled={isSubmitting || tempPassword.length < 4}
              className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-xl transition-all"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              تأكيد وتفعيل الحساب
            </Button>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="w-full h-14 rounded-2xl font-black text-lg border-slate-200">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
