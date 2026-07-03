
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Clock, 
  Mail, 
  Trash2, 
  Edit3, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileText,
  Phone,
  MessageCircle,
  Link as LinkIcon,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, addDoc, setDoc } from "firebase/firestore";
import { AddTestingModal, type TestingGroupData } from "@/components/modals/add-testing-modal";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/language-provider";

export default function TestersManagementPage() {
  const { t, dir } = useTranslation();
  const [testingGroups, setTestingGroups] = useState<TestingGroupData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TestingGroupData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isAdmin = profile?.role === 'admin';
  const hasTesterPermission = isAdmin && (profile?.permissions || []).includes('p_testers');

  useEffect(() => {
    if (authLoading) return;
    if (!hasTesterPermission) {
      setLoading(false);
      return;
    }
    if (!db) return;
    
    const unsub = onSnapshot(collection(db, "testing_groups"), (snap) => {
      setTestingGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as TestingGroupData)));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [hasTesterPermission, authLoading]);

  const filteredGroups = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return testingGroups;
    return testingGroups.filter(g => 
      g.projectName.toLowerCase().includes(s) || 
      g.testers.some(t => t.email.toLowerCase().includes(s) || (t.phone && t.phone.includes(s)))
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
    if (!db || !confirm("هل أنت متأكد من حذف هذا المشروع من الاختبار؟")) return;
    try {
      await deleteDoc(doc(db, "testing_groups", id));
      toast({ title: "تم الحذف", description: "تمت إزالة مجموعة الاختبار" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleSendWhatsAppNotifications = (group: TestingGroupData) => {
    if (!group.testers || group.testers.length === 0) {
      toast({ title: "تنبيه", description: "لا يوجد مختبرين في هذا المشروع للإرسال لهم.", variant: "destructive" });
      return;
    }

    group.testers.forEach((tester, index) => {
      if (!tester.phone) return;

      // تنظيف الرقم وإضافة كود مصر +20
      let cleanPhone = tester.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone;
      } else if (!cleanPhone.startsWith('2')) {
        cleanPhone = '20' + cleanPhone;
      }

      const message = `*تنبيه مهمة اختبار - APP STORE* 🚀\n\nمرحباً، يسرنا إبلاغكم بأنه قد تم تكليفكم بمهمة اختبار لمشروع: *${group.projectName}*\n\n*تفاصيل المواعيد المحددة لكم:*\n📅 ${tester.assignedDays.join('، ')}\n\n*رابط نسخة الاختبار والمرفقات:*\n🔗 ${group.resourceLink || 'سيتم تزويدكم به لاحقاً'}\n\n${group.notes ? `*تعليمات إضافية:*\n📝 ${group.notes}` : ''}\n\nيرجى البدء في الاختبار وموافاتنا بالتقارير في المواعيد المحددة.\nبالتوفيق، فريق إدارة الجودة.`;

      const encodedMessage = encodeURIComponent(message);
      
      // استخدام whatsapp:// لفتح التطبيق مباشرة دون بروزر
      setTimeout(() => {
        window.open(`whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`, `wa_tester_${cleanPhone}`);
      }, index * 1500);
    });

    toast({ 
      title: "جاري إرسال التنبيهات", 
      description: `يتم الآن فتح ${group.testers.length} محادثة مباشرة في تطبيق واتساب (+2).` 
    });
  };

  const handleExportCSV = (specificGroup?: TestingGroupData) => {
    const dataToExport = specificGroup ? [specificGroup] : filteredGroups;

    if (dataToExport.length === 0) {
      toast({ title: "تنبيه", description: "لا توجد بيانات لتصديرها حالياً", variant: "destructive" });
      return;
    }

    const rows = dataToExport.flatMap(group => 
      group.testers.map(tester => [
        tester.email
      ])
    );

    const csvContent = "\uFEFF" + [
      "البريد الإلكتروني",
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = specificGroup 
      ? `إيميلات_مختبرين_مشروع_${specificGroup.projectName}.csv`
      : `جميع_إيميلات_المختبرين.csv`;
    
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "تم التصدير", description: "تم تحميل قائمة الإيميلات بنجاح" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500 rounded-lg font-black">تم الاختبار</Badge>;
      case 'in_progress': return <Badge className="bg-orange-500 rounded-lg font-black">جارِ الاختبار</Badge>;
      default: return <Badge className="bg-slate-400 rounded-lg font-black">في الانتظار</Badge>;
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  if (!hasTesterPermission) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-20 w-20 mx-auto mb-6 text-slate-200" />
          <h2 className="text-3xl font-black text-slate-800 mb-2">{t('access_restricted')}</h2>
          <p className="text-slate-500 font-bold">{t('access_restricted_desc')}</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-2xl h-12 px-8 font-black">{t('back')}</Button>
        </div>
      </div>
    );
  }

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
            onClick={() => handleExportCSV()}
            className="rounded-2xl h-14 px-6 font-black text-lg gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Download className="h-5 w-5" /> تصدير كل الإيميلات
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
          placeholder="ابحث باسم المشروع أو بيانات المختبر (إيميل/هاتف)..." 
          className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden border border-slate-50 group flex flex-col h-full">
            <CardHeader className="p-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المشروع المستهدف</span>
                  </div>
                  <CardTitle className="text-xl font-black text-slate-800 truncate">{group.projectName}</CardTitle>
                </div>
                {getStatusBadge(group.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
              <div className="space-y-4 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs font-black uppercase">المختبرون ({group.testers.length})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleExportCSV(group)}
                    className="h-8 rounded-lg text-primary hover:bg-primary/5 font-black text-[10px] gap-1 px-2"
                  >
                    <FileSpreadsheet className="h-3 w-3" /> تصدير إيميلات المشروع
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 max-h-[250px] pr-2 custom-scrollbar">
                  <div className="space-y-3">
                    {group.testers.map((tester, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-100 flex flex-col gap-2 shadow-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-primary" />
                            <span className="text-xs font-bold text-slate-700 truncate">{tester.email}</span>
                          </div>
                          {tester.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400" dir="ltr">{tester.phone}</span>
                            </div>
                          )}
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
                </ScrollArea>
              </div>

              {(group.resourceLink || group.notes) && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 shrink-0">
                  {group.notes && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                        <FileText className="h-3 w-3" /> تعليمات المختبرين
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed bg-white/50 p-2 rounded-lg border border-slate-100 line-clamp-3">
                        {group.notes}
                      </p>
                    </div>
                  )}
                  {group.resourceLink && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase">رابط المرفقات</span>
                        <LinkIcon className="h-3 w-3 text-primary" />
                      </div>
                      <a 
                        href={group.resourceLink} 
                        target="_blank" 
                        className="text-[10px] font-black text-primary truncate block hover:underline flex items-center gap-2"
                      >
                        {group.resourceLink} <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {group.status !== 'completed' && (
                <Button 
                  onClick={() => handleSendWhatsAppNotifications(group)}
                  className="w-full h-12 rounded-2xl font-black text-xs gap-2 bg-green-500 hover:bg-green-600 text-white shadow-lg active:scale-95 transition-all mt-auto shrink-0"
                >
                  <MessageCircle className="h-4 w-4" /> إرسال تنبيهات واتساب لجميع المختبرين
                </Button>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 border-t flex gap-2 shrink-0">
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
