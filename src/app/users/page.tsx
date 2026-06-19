"use client";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Search, 
  Lock, 
  BadgeCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Trash2,
  Phone,
  UserPlus,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function UsersPermissionsPage() {
  const [allClients, setAllClients] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
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
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubUsers();
    };
  }, [profile, router]);

  const handleGrantAccess = async (client: any) => {
    const password = prompt(`أدخل كلمة مرور مخصصة للعميل (${client.name}):`);
    if (!password || password.length < 4) {
      alert("يرجى إدخال كلمة مرور صالحة (4 رموز على الأقل).");
      return;
    }

    try {
      await setDoc(doc(db!, "users_provision", client.email), {
        name: client.name,
        email: client.email,
        phone: client.phone,
        role: "client",
        status: "active",
        tempPassword: password,
        permissions: ["p_projects", "p_finances"]
      });
      toast({ title: "تم التجهيز", description: "يمكن للعميل الآن تسجيل الدخول بكلمة المرور هذه." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل منح الصلاحية.", variant: "destructive" });
    }
  };

  const handleRevokeAccess = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف الحساب وسحب الصلاحية؟")) {
      try {
        await deleteDoc(doc(db!, "users", id));
        toast({ title: "تم الحذف", description: "تم سحب صلاحية الدخول نهائياً." });
      } catch (err) {
        toast({ title: "خطأ", description: "فشل سحب الصلاحية.", variant: "destructive" });
      }
    }
  };

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return allClients.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(s)
    );
  }, [allClients, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header>
        <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-primary" /> إدارة الصلاحيات
        </h1>
        <p className="text-slate-500 font-bold">منح العملاء حق الوصول لمتابعة مشاريعهم وحساباتهم</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="ابحث بالاسم أو الهاتف..." 
                className="pr-10 h-12 rounded-2xl border-slate-200 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredClients.map(client => (
                  <div key={client.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                    </div>
                    <Button size="sm" onClick={() => handleGrantAccess(client)} className="rounded-xl font-black gap-2">
                      <UserPlus className="h-3 w-3" /> منح دخول
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-primary p-6 text-primary-foreground">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <BadgeCheck className="h-6 w-6" /> الحسابات النشطة (كلمات المرور تظهر لك فقط)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsers.map(user => (
                <div key={user.id} className="p-6 flex justify-between items-center hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-xl">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{user.email} • {user.role === 'admin' ? 'مدير' : 'عميل'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 px-4 rounded-2xl border flex items-center gap-4 min-w-[150px]">
                      <div className="flex-1 text-center">
                        <p className="text-[8px] text-slate-400 font-black">كلمة المرور</p>
                        <p className="font-black text-slate-800 tracking-widest">
                          {showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} className="h-8 w-8">
                        {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {user.role !== 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeAccess(user.id)} className="text-rose-500 hover:bg-rose-50 h-10 w-10">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
