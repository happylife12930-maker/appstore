
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  UserPlus, 
  Shield, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Settings2,
  UserCheck,
  Briefcase,
  Bug,
  Loader2,
  ShieldAlert,
  Home
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, doc, setDoc, onSnapshot, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useRouter } from "next/navigation";

const permissionsList = [
  { id: "p_dashboard", label: "لوحة التحكم", icon: Shield },
  { id: "p_clients", label: "إدارة العملاء", icon: UserCheck },
  { id: "p_projects", label: "إدارة المشاريع", icon: Briefcase },
  { id: "p_testers", label: "إدارة المختبرين", icon: Bug },
  { id: "p_finances", label: "التقارير المالية", icon: Settings2 },
];

export default function UsersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
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
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}><Home className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-2xl font-headline font-bold">إدارة المستخدمين</h2>
            <p className="text-muted-foreground text-sm">تعديل الأدوار وصلاحيات الفريق.</p>
          </div>
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
                  <label className="text-sm font-bold">الدور</label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="tester">مختبر</SelectItem>
                      <SelectItem value="client">عميل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4 border-r pr-6">
                <label className="text-sm font-bold block mb-2">الصلاحيات</label>
                <div className="grid gap-3">
                  {permissionsList.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={perm.id} 
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm cursor-pointer">{perm.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-bold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell>
                      {user.status === 'active' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold"><CheckCircle2 className="h-3 w-3" /> نشط</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-500 font-bold"><XCircle className="h-3 w-3" /> معطل</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
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
