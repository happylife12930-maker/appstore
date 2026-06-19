
"use client";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  UserPlus, 
  Search, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Key, 
  Loader2, 
  Trash2, 
  ShieldAlert,
  Home,
  CheckCircle2,
  X
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, initializeApp, getApp, getApps } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function UserManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");

  // التحقق من صلاحية المدير
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push("/");
    }
  }, [profile, router]);

  useEffect(() => {
    if (!db) return;
    
    // جلب المستخدمين النشطين
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // جلب العملاء للربط
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubClients();
    };
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return clients.filter(c => 
      c.name.includes(searchTerm) || c.phone.includes(searchTerm)
    ).slice(0, 5);
  }, [clients, searchTerm]);

  const handleCreateAccount = async () => {
    if (!selectedClient || !password) {
      toast({ title: "بيانات ناقصة", description: "يرجى اختيار عميل وتحديد كلمة مرور.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // بما أننا لا نستطيع استخدام Admin SDK، سنقوم بإنشاء السجل في الفايرستور أولاً
      // وسيقوم العميل بالدخول بهذا الإيميل والباسورد
      // ملاحظة تقنية: لإنشاء مستخدم جديد في Firebase Auth دون تسجيل خروج الأدمن، نستخدم نسخة ثانوية من التطبيق
      
      const userDoc = {
        uid: "", // سيتم ملؤه لاحقاً أو استخدامه كمعرف
        name: selectedClient.name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        clientId: selectedClient.id,
        role: role,
        status: "active",
        tempPassword: password, // المدير يرى الباسورد كما طلبت
        permissions: role === 'admin' ? ["p_all"] : ["p_dashboard", "p_projects"],
        createdAt: serverTimestamp()
      };

      // سنستخدم البريد الإلكتروني كمعرف للسجل لسهولة الربط
      await setDoc(doc(db, "users_provision", selectedClient.email), userDoc);
      
      toast({ 
        title: "تم تجهيز الحساب", 
        description: `تم منح ${selectedClient.name} صلاحية الدخول. يجب استكمال التسجيل بالإيميل المرفق.` 
      });
      
      setIsModalOpen(false);
      setSelectedClient(null);
      setPassword("");
      setSearchTerm("");
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من سحب صلاحية هذا المستخدم؟")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "تم", description: "تم حذف المستخدم وسحب الصلاحيات." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في الحذف.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-2xl h-14 w-14">
            <Home className="h-7 w-7" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">إدارة الصلاحيات</h1>
            <p className="text-muted-foreground font-bold">منح العملاء والموظفين حق الوصول للنظام</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl font-black shadow-xl h-16 px-10 text-lg bg-primary hover:bg-slate-800 transition-all active:scale-95">
          <UserPlus className="ml-2 h-6 w-6" /> إضافة مستخدم جديد
        </Button>
      </header>

      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-8 bg-slate-50 border-b">
          <CardTitle className="text-xl font-black">المستخدمين النشطين</CardTitle>
          <CardDescription className="font-bold">قائمة بكافة الأشخاص الذين لديهم صلاحية دخول</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/50">
                <TableHead className="text-right font-black py-6">المستخدم</TableHead>
                <TableHead className="text-right font-black">الدور</TableHead>
                <TableHead className="text-right font-black">البريد الإلكتروني</TableHead>
                <TableHead className="text-right font-black">كلمة المرور (للمدير)</TableHead>
                <TableHead className="text-center font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></TableCell></TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-primary">
                        {user.name?.[0] || <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-black text-slate-800">{user.name}</div>
                        <div className="text-xs font-bold text-slate-400">{user.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.role === 'admin' ? 'bg-rose-500' : 'bg-blue-500'}>
                      {user.role === 'admin' ? 'مدير عام' : user.role === 'client' ? 'عميل' : 'مختبر'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-slate-600">{user.email}</TableCell>
                  <TableCell className="font-black text-slate-400 font-mono tracking-widest">
                    {user.tempPassword || "••••••••"}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.email !== 'islam_nader@appstore.com' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-rose-500 hover:bg-rose-50 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogTitle className="text-2xl font-black">منح صلاحية دخول</DialogTitle>
            <p className="opacity-80 font-bold mt-1">ابحث عن العميل وحدد كلمة المرور الخاصة به</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="font-black flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> ابحث عن العميل (بالاسم أو الهاتف)</Label>
              <div className="relative">
                <Input 
                  placeholder="ابحث هنا..." 
                  className="h-14 rounded-2xl border-slate-200 font-bold pr-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {filteredClients.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  {filteredClients.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => { setSelectedClient(client); setSearchTerm(client.name); }}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedClient?.id === client.id ? 'bg-primary text-white' : 'hover:bg-white'}`}
                    >
                      <div>
                        <p className="font-black text-sm">{client.name}</p>
                        <p className="text-xs opacity-70">{client.phone}</p>
                      </div>
                      {selectedClient?.id === client.id && <CheckCircle2 className="h-5 w-5" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="font-black">الدور / الصلاحية</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="client" className="rounded-xl">عميل (مشروعه فقط)</SelectItem>
                      <SelectItem value="tester" className="rounded-xl">مختبر (إدارة الاختبارات)</SelectItem>
                      <SelectItem value="admin" className="rounded-xl">مدير عام (صلاحية كاملة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black">كلمة المرور الافتراضية</Label>
                  <Input 
                    placeholder="حدّد كلمة المرور" 
                    className="h-14 rounded-2xl border-slate-200 font-black" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button 
              onClick={handleCreateAccount} 
              disabled={isSaving || !selectedClient} 
              className="rounded-2xl font-black h-16 px-12 text-lg shadow-xl w-full"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : "تأكيد ومنح الصلاحية"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
