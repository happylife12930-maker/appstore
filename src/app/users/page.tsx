
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  UserCheck, 
  Key, 
  ShieldCheck, 
  Loader2, 
  Trash2, 
  UserPlus,
  Eye,
  EyeOff,
  User,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    role: 'client',
    password: '',
    permissions: ['p_dashboard', 'p_projects']
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSearchClients = async () => {
    if (!searchQuery.trim() || !db) return;
    setSearching(true);
    try {
      // البحث في العملاء بالاسم أو الهاتف
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef);
      const snap = await getDocs(q);
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((c: any) => 
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.phone?.includes(searchQuery)
        );
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenProvision = (client: any) => {
    setSelectedClient(client);
    setFormData({
      role: 'client',
      password: '',
      permissions: ['p_dashboard', 'p_projects']
    });
    setIsModalOpen(true);
  };

  const handleProvisionUser = async () => {
    if (!formData.password || !db || !selectedClient) return;

    try {
      // نجهز طلب إنشاء الحساب في مجموعة خاصة "users_provision"
      // ليقوم النظام بإنشاء الحساب رسمياً عند أول محاولة دخول للعميل
      await setDoc(doc(db, 'users_provision', selectedClient.email), {
        uid: '', // سيتم ملؤه عند الدخول الأول
        email: selectedClient.email,
        name: selectedClient.name,
        role: formData.role,
        permissions: formData.permissions,
        tempPassword: formData.password,
        clientId: selectedClient.id,
        createdAt: serverTimestamp()
      });

      toast({ title: 'تم تجهيز الحساب', description: `يمكن للعميل الآن الدخول باستخدام البريد وكلمة المرور التي حددتها.` });
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في تجهيز صلاحيات المستخدم.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm('هل أنت متأكد من سحب الصلاحيات وحذف حساب هذا المستخدم؟')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      // أيضاً حذف أي طلب تجهيز معلق
      await deleteDoc(doc(db, 'users_provision', email));
      toast({ title: 'تم الحذف', description: 'تم سحب الصلاحيات بنجاح.' });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل في حذف المستخدم.', variant: 'destructive' });
    }
  };

  const togglePasswordVisibility = (uid: string) => {
    setShowPassword(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-rose-500" /> إدارة الصلاحيات والمستخدمين
          </h1>
          <p className="text-muted-foreground font-bold">منح العملاء والموظفين صلاحية الدخول للنظام</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* قسم البحث والإضافة */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b p-6">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> تجهيز مستخدم جديد
              </CardTitle>
              <CardDescription className="font-bold">ابحث عن عميل موجود لمنحه صلاحية الدخول</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="اسم العميل أو هاتفه..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClients()}
                  className="rounded-xl h-12 font-bold"
                />
                <Button onClick={handleSearchClients} disabled={searching} className="rounded-xl h-12 px-4">
                  {searching ? <Loader2 className="animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                {searchResults.map((client) => (
                  <div key={client.id} className="p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-black text-slate-800">{client.name}</p>
                      <p className="text-xs text-slate-400 font-bold" dir="ltr">{client.phone}</p>
                    </div>
                    <Button size="sm" onClick={() => handleOpenProvision(client)} className="rounded-xl font-black h-10 px-4">منح صلاحية</Button>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && !searching && (
                  <p className="text-center text-sm font-bold text-slate-400 py-4 italic">لا توجد نتائج بحث</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قائمة المستخدمين الحاليين */}
        <div className="lg:col-span-2">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden min-h-[600px]">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-2xl font-black">المستخدمون النشطون</CardTitle>
              <CardDescription className="font-bold">قائمة بكافة الأشخاص الذين لديهم صلاحية الدخول</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => (
                    <div key={user.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${user.role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                          {user.role === 'admin' ? <ShieldCheck className="h-7 w-7" /> : <UserCheck className="h-7 w-7" />}
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-slate-800">{user.name}</h4>
                          <p className="text-sm font-bold text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-lg font-black text-sm uppercase">
                          {user.role}
                        </Badge>
                        
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                          <Key className="h-4 w-4 text-slate-400" />
                          <span className="font-black text-sm font-mono">
                            {showPassword[user.id] ? user.tempPassword || '******' : '••••••••'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(user.id)} className="text-slate-400 hover:text-primary p-1">
                            {showPassword[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.email)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="py-20 text-center">
                      <ShieldCheck className="h-16 w-16 mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold">لا يوجد مستخدمون مسجلون حالياً</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مودال منح الصلاحية */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <DialogHeader className="bg-primary p-10 text-primary-foreground">
            <DialogTitle className="text-2xl font-black">منح صلاحية دخول</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold mt-2">
              أنت بصدد منح العميل <span className="text-white underline">{selectedClient?.name}</span> صلاحية الدخول للنظام.
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <Label className="font-black flex items-center gap-2"><User className="h-4 w-4" /> الدور الوظيفي</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 font-bold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl" className="font-bold">
                  <SelectItem value="client">عميل (مشاهدة مشروعه فقط)</SelectItem>
                  <SelectItem value="tester">مختبر (إدارة حالات الاختبار)</SelectItem>
                  <SelectItem value="admin">مدير (صلاحية كاملة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black flex items-center gap-2"><Key className="h-4 w-4" /> كلمة المرور المبدئية</Label>
              <Input 
                placeholder="أدخل كلمة مرور قوية..." 
                className="h-14 rounded-2xl border-slate-200 font-black text-xl" 
                value={formData.password}
                onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0" />
              <p className="text-xs font-bold text-amber-700">
                سيتم تفعيل الحساب فور محاولة العميل الدخول ببريده المسجل ({selectedClient?.email}) وكلمة المرور هذه.
              </p>
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 border-t gap-3">
            <Button onClick={handleProvisionUser} disabled={!formData.password} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl">
              تجهيز الحساب وإرساله
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
