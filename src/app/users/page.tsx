
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  Key, 
  Lock, 
  BadgeCheck, 
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    const password = prompt("أدخل كلمة المرور لهذا العميل:");
    if (!password || password.length < 6) {
      alert("يجب إدخال كلمة مرور مكونة من 6 أرقام/حروف على الأقل.");
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

      toast({ title: "تم التجهيز", description: `يمكن للعميل الآن الدخول بكلمة المرور: ${password}` });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل منح الصلاحية.", variant: "destructive" });
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (confirm("هل تريد سحب صلاحية الدخول من هذا العميل؟")) {
      try {
        await deleteDoc(doc(db!, "users_provision", email));
        toast({ title: "تم السحب", description: "تم إلغاء صلاحية العميل." });
      } catch (err) {
        toast({ title: "خطأ", description: "فشل سحب الصلاحية.", variant: "destructive" });
      }
    }
  };

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const filteredClients = allClients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.includes(searchQuery)
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header>
        <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-rose-500" /> إدارة الصلاحيات
        </h1>
        <p className="text-slate-500 font-bold mt-2">ابحث بالاسم أو الهاتف لمنح العميل صلاحية الدخول</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6 text-center">
            <CardTitle className="text-xl font-black">البحث عن العملاء</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="الاسم أو الهاتف (أو جزء منه)..." 
                className="pr-10 h-12 rounded-2xl border-slate-200 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-3">
                {filteredClients.map(client => (
                  <div key={client.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white transition-all shadow-sm">
                    <div>
                      <p className="font-black text-slate-800">{client.name}</p>
                      <p className="text-xs font-bold text-slate-400" dir="ltr">{client.phone}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGrantAccess(client)}
                      className="rounded-xl font-black h-10 shadow-sm transition-all"
                    >
                      <Key className="h-4 w-4 ml-1" /> منح
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-primary p-8 text-primary-foreground">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <BadgeCheck className="h-7 w-7" /> المستخدمين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activeUsers.map(user => (
                <div key={user.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-2xl">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-800">{user.name}</p>
                      <p className="text-sm font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-4 rounded-2xl border flex items-center gap-3 min-w-[220px]">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-black">كلمة المرور</p>
                        <p className="font-black text-slate-800">
                          {showPasswords[user.email] ? user.tempPassword || 'غير مسجلة' : '••••••••'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => togglePasswordVisibility(user.email)} className="rounded-xl h-8 w-8">
                        {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {user.role !== 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeAccess(user.email)} className="text-rose-500 hover:bg-rose-50 rounded-xl">
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
