
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
import { collection, doc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";

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
  const db = useFirestore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "tester",
    permissions: [] as string[]
  });

  useEffect(() => {
    if (!db) return;

    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(
      usersQuery, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: "users",
          operation: "list"
        });
        errorEmitter.emit('permission-error', permissionError);
        setError("لا تملك الصلاحية لعرض قائمة المستخدمين حالياً.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !db) return;
    setSaving(true);
    const userRef = doc(collection(db, "users")); 
    const newUserData = {
      ...formData,
      uid: userRef.id,
      status: "active",
      lastLogin: "لم يسجل بعد",
      createdAt: new Date().toISOString()
    };

    setDoc(userRef, newUserData)
      .then(() => {
        setIsAddUserOpen(false);
        setFormData({ name: "", email: "", role: "tester", permissions: [] });
        toast({ title: "تم الحفظ", description: "تم إنشاء المستخدم بنجاح." });
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: "create",
          requestResourceData: newUserData
        }));
      })
      .finally(() => setSaving(false));
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
          <h2 className="text-2xl font-headline font-bold">إدارة المستخدمين</h2>
          <p className="text-muted-foreground text-sm">تعديل الأدوار وصلاحيات الظهور في القائمة.</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <UserPlus className="ml-2 h-4 w-4" /> إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
              <DialogDescription>حدد بيانات المستخدم ودوره الأساسي.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الاسم الكامل</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="اسم المستخدم"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">البريد الإلكتروني</label>
                  <Input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@example.com"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">الدور الأساسي</label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({...formData, role: val as any})}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير (Admin)</SelectItem>
                      <SelectItem value="tester">مختبر (Tester)</SelectItem>
                      <SelectItem value="client">عميل (Client)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 border-r pr-6">
                <label className="text-sm font-bold block mb-2 text-primary">صلاحيات الوصول</label>
                <div className="grid gap-3">
                  {permissionsList.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={perm.id} 
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <perm.icon className="h-3.5 w-3.5 opacity-50" />
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ البيانات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
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
                      <Badge variant="outline" className="font-bold">{user.role}</Badge>
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
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
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
