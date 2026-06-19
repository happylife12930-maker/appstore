"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ShieldAlert,
  Home,
  Shield,
  UserCheck,
  Briefcase,
  Settings2,
  Bug
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
import { Card, CardContent } from "@/components/ui/card";
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
    permissions: ["p_dashboard"] as string[]
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
        setError("لا تملك الصلاحية لعرض هذه الصفحة.");
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
      lastLogin: "-",
      createdAt: new Date().toISOString()
    };

    setDoc(userRef, newUserData)
      .then(() => {
        setIsAddUserOpen(false);
        setFormData({ name: "", email: "", role: "tester", permissions: ["p_dashboard"] });
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
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 opacity-50" />
        <h3 className="text-xl font-bold">خطأ في الصلاحيات</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/")} className="rounded-xl">العودة للرئيسية</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
            <Home className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-headline font-bold">إدارة الفريق</h2>
            <p className="text-muted-foreground text-sm">إدارة حسابات المختبرين والمديرين.</p>
          </div>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold rounded-xl px-6">
              <UserPlus className="ml-2 h-4 w-4" /> إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الاسم بالكامل</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="اسم الموظف"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">البريد الإلكتروني</label>
                  <Input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@appstore.com"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">الدور الوظيفي</label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير نظام</SelectItem>
                      <SelectItem value="tester">مختبر تطبيقات</SelectItem>
                      <SelectItem value="client">عميل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4 border-r pr-8">
                <label className="text-sm font-bold block mb-4">الصلاحيات الممنوحة</label>
                <div className="space-y-3">
                  {permissionsList.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg">
                      <Checkbox 
                        id={perm.id} 
                        checked={formData.permissions.includes(perm.id)}
                        onCheckedChange={() => handleTogglePermission(perm.id)}
                      />
                      <label htmlFor={perm.id} className="text-sm font-medium cursor-pointer">{perm.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button onClick={handleSaveUser} disabled={saving} className="rounded-xl w-full">
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ وإضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg overflow-hidden rounded-3xl bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-bold">جاري تحميل القائمة...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold py-5">الموظف</TableHead>
                  <TableHead className="text-right font-bold">الدور</TableHead>
                  <TableHead className="text-right font-bold">الحالة</TableHead>
                  <TableHead className="text-right font-bold">آخر ظهور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-lg">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-4 border-primary/20 text-primary">
                        {user.role === 'admin' ? 'مدير' : 'مختبر'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <CheckCircle2 className="h-4 w-4" /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-rose-500 font-bold">
                          <XCircle className="h-4 w-4" /> معطل
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{user.lastLogin}</TableCell>
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