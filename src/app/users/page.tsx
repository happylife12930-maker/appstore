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
  Phone
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
      if (password) alert("كلمة المرور يجب أن تكون 4 أحرف على الأقل.");
      return;
    }

    try {
      await setDoc(doc(db!, "users_provision", client.email), {
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        role: "client",
        status: "active",
        tempPassword: password,
        permissions: ["p_projects"]
      });
      toast({ title: "تم التجهيز", description: "يمكن للعميل الدخول الآن باستخدام بريده وكلمة المرور هذه." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل منح الصلاحية.", variant: "destructive" });
    }
  };

  const handleRevokeAccess = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف حساب هذا المستخدم؟")) {
      try {
        await deleteDoc(doc(db!, "users", id));
        toast({ title: "تم السحب", description: "تم إلغاء صلاحية الدخول نهائياً." });
      } catch (err) {
        toast({ title: "خطأ", description: "فشل حذف الحساب.", variant: "destructive" });
      }
    }
  };

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return allClients.filter(c => 
      (c.name || "").toLowerCase().includes(s) || 
      (c.phone || "").includes(searchQuery)
    );
  }, [allClients, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header>
        <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-primary" /> إدارة الصلاحيات
        </h1>
        <p className="text-slate-500 font-bold">منح حق الوصول للعملاء وإدارة كلمات المرور</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6">
            <p className="text-sm font-black text-slate-500 mb-4">ابحث عن عميل (بالاسم أو الهاتف)</p>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="ابحث هنا..." 
                className="pr-10 h-12 rounded-2xl font-bold border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredClients.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 font-bold text-sm">لا يوجد عملاء بهذا الاسم</p>
                ) : filteredClients.map(client => (
                  <div key={client.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1" dir="ltr">
                        <Phone className="h-2 w-2" /> {client.phone || "بدون هاتف"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleGrantAccess(client)} className="rounded-xl font-black gap-2 h-9">
                      <UserPlus className="h-3.5 w-3.5" /> منح دخول
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
              <BadgeCheck className="h-6 w-6" /> الحسابات النشطة (كلمات المرور)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activeUsers.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-bold">لا يوجد حسابات نشطة حالياً</div>
              ) : activeUsers.map(user => (
                <div key={user.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-xl uppercase">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-slate-50 p-2 px-4 rounded-2xl border flex items-center gap-4 flex-1 sm:min-w-[180px]">
                      <div className="flex-1 text-center">
                        <Key className="h-3 w-3 text-slate-400 mx-auto mb-1" />
                        <p className="font-black text-slate-800 tracking-widest text-sm">
                          {showPasswords[user.email] ? user.tempPassword || '----' : '••••••••'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowPasswords(p => ({...p, [user.email]: !p[user.email]}))} className="h-8 w-8 rounded-lg">
                        {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {user.role !== 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeAccess(user.id)} className="text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-xl">
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