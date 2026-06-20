
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Link as LinkIcon, 
  Mail, 
  Trash2, 
  Edit3, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, addDoc, setDoc } from "firebase/firestore";
import { AddTestingModal, type TestingGroupData } from "@/components/modals/add-testing-modal";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function TestersManagementPage() {
  const [testingGroups, setTestingGroups] = useState<TestingGroupData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TestingGroupData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push("/");
      return;
    }
    if (!db) return;
    
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      setTestingGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as TestingGroupData)));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [profile, router]);

  const filteredGroups = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return testingGroups;
    return testingGroups.filter(g => 
      g.projectName.toLowerCase().includes(s) || 
      g.testers.some(t => t.email.toLowerCase().includes(s))
    );
  }, [testingGroups, searchQuery]);

  const handleSaveGroup = async (data: TestingGroupData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "testing_groups", data.id), data);
        toast({ title: "تم التحديث", description: "تم تعديل بيانات مجموعة الاختبار بنجاح" });
      } else {
        await addDoc(collection(db, "testing_groups"), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "تم البدء", description: "تم إنشاء مجموعة اختبار جديدة بنجاح" });
      }
      setIsModalOpen(false);
      setEditingGroup(null);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف مهمة الاختبار هذه؟")) return;
    try {
      await deleteDoc(doc(db, "testing_groups", id));
      toast({ title: "تم الحذف", description: "تمت إزالة مجموعة الاختبار" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (filteredGroups.length === 0) {
      toast({ title: "تنبيه", description: "لا توجد بيانات لتصديرها حالياً", variant: "destructive" });
      return;
    }

    // تجهيز البيانات
    const headers = ["المشروع", "بريد المختبر", "أيام العمل", "حالة المهمة"];
    const rows = filteredGroups.flatMap(group => 
      group.testers.map(tester => [
        group.projectName,
        tester.email,
        tester.assignedDays.join(" - "),
        group.status === 'completed' ? 'تم الاختبار' : group.status === 'in_progress' ? 'جارِ الاختبار' : 'في الانتظار'
      ])
    );

    // بناء المحتوى بصيغة CSV مع دعم اللغة العربية (UTF-8 BOM)
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `قائمة_المختبرين_${new Date().toLocaleDateString('ar-EG')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "تم التصدير", description: "تم تحميل ملف المختبرين بنجاح" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500 rounded-lg font-black">تم الاختبار</Badge>;
      case 'in_progress': return <Badge className="bg-orange-500 rounded-lg font-black">جارِ الاختبار</Badge>;
      default: return <Badge className="bg-slate-400 rounded-lg font-black">في الانتظار</Badge>;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل بيانات المختبرين...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <UserCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المختبرين</h1>
            <p className="text-slate-500 font-bold">ربط المشاريع بالمختبرين، تحديد المواعيد، ومتابعة الجودة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-2xl h-14 px-6 font-black text-lg gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Download className="h-5 w-5" /> تصدير CSV
          </Button>
          <Button 
            onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}
            className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
          >
            <Plus className="h-6 w-6" /> تعيين مشروع للاختبار
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث باسم المشروع أو إيميل المختبر..." 
          className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden border border-slate-50 group flex flex-col">
            <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المشروع المستهدف</span>
                  </div>
                  <CardTitle className="text-xl font-black text-slate-800">{group.projectName}</CardTitle>
                </div>
                {getStatusBadge(group.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs font-black uppercase">المختبرون ({group.testers.length})</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.testers.map((tester, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold text-slate-700">{tester.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tester.assignedDays.map(day => (
                          <Badge key={day} variant="outline" className="text-[8px] font-black rounded-md px-2 py-0.5 bg-slate-50">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {group.resourceLink && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-primary uppercase">رابط المرفقات</span>
                    <LinkIcon className="h-3 w-3 text-primary" />
                  </div>
                  <a 
                    href={group.resourceLink} 
                    target="_blank" 
                    className="text-xs font-bold text-slate-600 truncate block hover:text-primary transition-colors flex items-center gap-2"
                  >
                    {group.resourceLink} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}
                className="flex-1 rounded-xl font-black text-xs gap-2 text-primary hover:bg-primary/5"
              >
                <Edit3 className="h-4 w-4" /> تعديل المهمة
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleDeleteGroup(group.id!)}
                className="rounded-xl h-10 w-10 text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {filteredGroups.length === 0 && (
          <Card className="col-span-full py-20 text-center rounded-[3rem] border-dashed border-2 bg-slate-50/50">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-black text-slate-400 uppercase tracking-widest">لا توجد مشاريع قيد الاختبار حالياً</p>
          </Card>
        )}
      </div>

      <AddTestingModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingGroup(null); }}
        onSave={handleSaveGroup}
        isLoading={isSaving}
        initialData={editingGroup}
      />
    </div>
  );
}
