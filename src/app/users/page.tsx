"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Key, 
  UserPlus, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff,
  Phone,
  Mail,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  getDocs, 
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "client" as "admin" | "tester" | "client",
    tempPassword: "",
    clientId: ""
  });

  const [clientSearch, setClientSearch] = useState("");
  const [foundClients, setFoundClients] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [searchingClient, setSearchingClient] = useState(false);

  useEffect(() => {
    if (!db || profile?.role !== 'admin') return;
    
    // جلب كل المستخدمين
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // جلب كل العملاء للبحث المحلي (أسرع وأدق للبحث بالاسم أو الهاتف)
    const fetchClients = async () => {
      const snap = await getDocs(collection(db, "clients"));
      setAllClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchClients();

    return () => unsubUsers();
  }, [profile]);

  const handleSearchClients = () => {
    if (!clientSearch) {
      setFoundClients([]);
      return;
    }
    const searchLower = clientSearch.toLowerCase();
    const results = allClients.filter(c => 
      c.name?.toLowerCase().includes(searchLower) || 
      c.phone?.includes(clientSearch)
    );
    setFoundClients(results);
    if (results.length === 0) {
      toast({ title: "عذراً", description: "لم يتم العثور على عميل بهذا الاسم أو الرقم.", variant: "destructive" });
    }
  };

  const selectClient = (client: any) => {
    setFormData(prev => ({
      ...prev,
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      clientId: client.id
    }));
    setFoundClients([]);
    setClientSearch("");
  };

  const handleSaveUser = async () => {
    if (!formData.email || !formData.tempPassword) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال البريد الإلكتروني وكلمة المرور.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const userData = {
        ...formData,
        status: "active",
        permissions: formData.role === 'admin' ? ['p_all'] : (formData.role === 'client' ? ['p_dashboard', 'p_projects'] : ['p_testers']),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "users_provision", formData.email), userData);
      
      toast({ 
        title: "تم تجهيز الحساب", 
        description: `تم إنشاء حساب لـ ${formData.name}. يمكنه الدخول الآن باستخدام الباسورد المحدد.` 
      });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", role: "client", tempPassword: "", clientId: "" });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ بيانات المستخدم.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم ومنع وصوله للنظام؟")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "تم الحذف", description: "تم سحب صلاحيات الوصول للمستخدم." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حذف المستخدم." });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="h-20 w-20 text-rose-500 animate-pulse" />
        <h1 className="text-3xl font-black text-slate-800">صلاحية وصول محدودة</h1>
        <p className="text-slate-500 font-bold">هذه الشاشة مخصصة لإدارة الوكالة فقط.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary" /> إدارة الصلاحيات
          </h1>
          <p className="text-muted-foreground font-bold text-lg mt-2">البحث عن العملاء وتجهيز حسابات الدخول</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl font-black h-16 px-10 text-xl shadow-xl transition-all active:scale-95">
          <UserPlus className="ml-3 h-7 w-7" /> إضافة مستخدم جديد
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
              <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${user.role === 'admin' ? 'bg-primary' : (user.role === 'client' ? 'bg-blue-500' : 'bg-orange-500')}`}>
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800">{user.name}</h3>
                    <Badge variant="outline" className="mt-1 font-black bg-white">{user.role === 'admin' ? 'مدير عام' : (user.role === 'client' ? 'عميل' : 'مختبر جودة')}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 font-bold">
                    <Mail className="h-5 w-5 text-primary" /> {user.email}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-bold">
                    <Phone className="h-5 w-5 text-primary" /> <span dir="ltr">{user.phone || 'غير مسجل'}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex justify-between items-center group/pass">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-amber-500" />
                      <span className="font-black text-slate-700">كلمة المرور:</span>
                      <span className="font-black text-primary text-lg">
                        {showPassword[user.id] ? (user.tempPassword || '••••••••') : '••••••••'}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => togglePasswordVisibility(user.id)} className="rounded-full">
                      {showPassword[user.id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <DialogHeader className="bg-primary p-10 text-primary-foreground">
            <DialogTitle className="text-3xl font-black">تجهيز حساب مستخدم</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold text-lg mt-2">ابحث بالاسم أو الهاتف لربط العميل بحساب دخول.</DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-8">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
              <label className="font-black text-slate-800 pr-2">البحث عن عميل (اسم أو هاتف)</label>
              <div className="flex gap-3">
                <Input 
                  placeholder="ابحث هنا..." 
                  className="rounded-2xl h-14 border-slate-200 font-bold" 
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClients()}
                />
                <Button onClick={handleSearchClients} className="rounded-2xl h-14 px-8 font-black">بحث</Button>
              </div>

              {foundClients.length > 0 && (
                <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                  {foundClients.map((client) => (
                    <div 
                      key={client.id} 
                      onClick={() => selectClient(client)}
                      className="p-4 bg-white border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors flex justify-between items-center"
                    >
                      <span className="font-black">{client.name}</span>
                      <span className="text-xs text-slate-400 font-bold" dir="ltr">{client.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-black text-slate-700 pr-2">الاسم بالكامل</label>
                <Input value={formData.name} readOnly className="rounded-2xl h-14 bg-slate-50 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="font-black text-slate-700 pr-2">الرتبة / الدور</label>
                <Select value={formData.role} onValueChange={(val: any) => setFormData(prev => ({ ...prev, role: val }))}>
                  <SelectTrigger className="rounded-2xl h-14 border-sidebar-border font-black">
                    <SelectValue placeholder="اختر الرتبة" />
                  </SelectTrigger>
                  <SelectContent className="font-black">
                    <SelectItem value="admin">مدير (Admin)</SelectItem>
                    <SelectItem value="client">عميل (Client)</SelectItem>
                    <SelectItem value="tester">مختبر (Tester)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-black text-slate-700 pr-2">البريد الإلكتروني (للدخول)</label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-2xl h-14 border-slate-200 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="font-black text-slate-700 pr-2">كلمة المرور (حددها له)</label>
                <Input 
                  type="text"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempPassword: e.target.value }))}
                  className="rounded-2xl h-14 border-slate-200 font-black text-amber-600" 
                  placeholder="اكتب الباسورد هنا"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 border-t gap-4">
            <Button onClick={handleSaveUser} disabled={isSaving || !formData.email} className="rounded-2xl font-black h-16 px-16 text-xl shadow-2xl w-full">
              {isSaving ? <Loader2 className="animate-spin" /> : "تأكيد وتجهيز الحساب"}
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-2xl font-black h-16 px-10 text-xl w-full">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
