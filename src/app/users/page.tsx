
"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  Key, 
  Lock, 
  BadgeCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Trash2,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
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
    const password = prompt(`أدخل كلمة المرور للعميل (${client.name}):`);
    if (!password || password.length < 6) {
      alert("يجب إدخال كلمة مرور مكونة من 6 أرقام/حروف على الأقل.");
      return;
    }

    try {
      // تجهيز الحساب في جدول المؤقتين حتى يسجل العميل دخوله لأول مرة
      await setDoc(doc(db!, "users_provision", client.email), {
        name: client.name,
        email: client.email,
        phone: client.phone,
        role: "client",
        status: "active",
        tempPassword: password,
        permissions: ["p_projects", "p_finances"]
      });

      toast({ title: "تم التجهيز", description: "يمكن للعميل الآن استخدام بريده وكلمة المرور للدخول." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل منح الصلاحية.", variant: "destructive" });
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (confirm("هل تريد سحب صلاحية الدخول نهائياً؟")) {
      try {
        await deleteDoc(doc(db!, "users_provision", email));
        // ملحوظة: في الإنتاج يفضل حذف حساب الـ Authentication أيضاً
        toast({ title: "تم السحب", description: "تم إلغاء صلاحية العميل." });
      } catch (err) {
        toast({ title: "خطأ", description: "فشل العملية.", variant: "destructive" });
      }
    }
  };

  const filteredClients = allClients.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.includes(searchQuery)
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-rose-500" /> إدارة الصلاحيات
        </h1>
        <p className="text-slate-500 font-bold">ابحث عن العميل بالاسم أو رقم الهاتف لمنحه حق الوصول للنظام</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* عمود البحث عن العملاء */}
        <Card className="lg:col-span-1 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
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
              <div className="space-y-2">
                {filteredClients.length > 0 ? filteredClients.map(client => (
                  <div key={client.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400" dir="ltr">{client.phone}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGrantAccess(client)}
                      className="rounded-xl font-black h-9 px-4"
                    >
                      <Key className="h-3 w-3 ml-1" /> منح دخول
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">لا توجد نتائج بحث</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* عمود المستخدمين الحاليين */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-primary p-6 text-primary-foreground">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <BadgeCheck className="h-6 w-6" /> الحسابات النشطة وكلمات المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activeUsers.map(user => (
                <div key={user.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-black text-xl">
                      {user.name?.[0]}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800">{user.name}</p>
                      <p className="text-xs font-bold text-slate-400">{user.email} • {user.role === 'admin' ? 'مدير' : 'عميل'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white p-3 rounded-2xl border flex items-center gap-3 min-w-[180px]">
                      <Lock className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-[9px] text-slate-400 font-black uppercase">كلمة المرور</p>
                        <p className="font-black text-slate-800 text-sm">
                          {showPasswords[user.email] ? user.tempPassword || '******' : '••••••••'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowPasswords(prev => ({ ...prev, [user.email]: !prev[user.email] }))} className="h-8 w-8">
                        {showPasswords[user.email] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {user.role !== 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeAccess(user.email)} className="text-rose-500 hover:bg-rose-50 rounded-xl">
                        <Trash2 className="h-4 w-4" />
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
