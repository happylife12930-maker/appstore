
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  UserPlus, 
  Shield, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Search,
  Settings2,
  Lock,
  UserCheck,
  Briefcase,
  Bug,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/components/language-provider";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const permissionsList = [
  { id: "p_dashboard", label: "لوحة التحكم", icon: Shield },
  { id: "p_clients", label: "إدارة العملاء", icon: UserCheck },
  { id: "p_projects", label: "إدارة المشاريع", icon: Briefcase },
  { id: "p_testers", label: "إدارة المختبرين", icon: Bug },
  { id: "p_finances", label: "التقارير المالية", icon: Settings2 },
];

export default function UsersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // فورم إضافة مستخدم
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "tester",
    permissions: [] as string[]
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"), 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn("Users Permission Error:", err.message);
        setError("لا تملك الصلاحية لعرض قائمة المستخدمين.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) return;
    setSaving(true);
    try {
      const userRef = doc(collection(db, "users")); 
      await setDoc(userRef, {
        ...formData,
        uid: userRef.id,
        status: "active",
        lastLogin: "لم يسجل بعد"
      });
      setIsAddUserOpen(false);
      setFormData({ name: "", email: "", role: "tester", permissions: [] });
      toast({ title: "تم الحفظ", description: "تم إنشاء المستخدم وتحديد صلاحياته بنجاح." });
    } catch (error: any) {
      const msg = error.code === 'permission-denied' ? "لا تملك صلاحية إضافة مستخدمين." : "فشل في حفظ البيانات.";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 opacity-50" />
        <h3 className="text-xl font-bold font-headline">خطأ في الصلاحيات</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-headline font-bold">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-muted-foreground text-sm">أضف مستخدمين جدد وحدد ما يمكنهم رؤيته في النظام.</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <UserPlus className="ml-2 h-4 w-4" /> إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء حساب مستخدم جديد</DialogTitle>
              <DialogDescription>حدد بيانات المستخدم ودوره الأساسي في الوكالة.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الاسم الكامل</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="اسم المستخدم" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">البريد الإلكتروني</label>
                  <Input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@example.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">نوع المستخدم (Role)</label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({...formData, role: val as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">أدمن (مدير كامل)</SelectItem>
                      <SelectItem value="tester">مختبر (Tester)</SelectItem>
                      <SelectItem value="client">عميل مستفيد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 border-r pr-6">
                <label className="text-sm font-bold block mb-2 text-primary">تحديد الصلاحيات (الظهور في القائمة)</label>
                <div className="grid gap-3">
                  {permissionsList.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-reverse space-x-2">
                      <Checkbox 
                        id={perm.id} 
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer pr-2">
                        <perm.icon className="h-3.5 w-3.5 opacity-50" />
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ المستخدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث عن مستخدم..." className="pr-10" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">جاري تحميل المستخدمين...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">آخر دخول</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' :
                        user.role === 'tester' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {user.role === 'admin' ? 'مدير (Admin)' :
                         user.role === 'tester' ? 'مختبر (Tester)' : 'عميل (Client)'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.status === 'active' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                          <XCircle className="h-3 w-3" /> غير نشط
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Lock className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
