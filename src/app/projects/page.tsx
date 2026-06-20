
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon,
  Loader2,
  X,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc, query, where } from "firebase/firestore";
import { ProjectModal, type ProjectData } from "@/components/modals/project-modal";
import { ProjectDetailsModal } from "@/components/modals/project-details-modal";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function ProjectsContent() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<ProjectData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const hasProjectPermission = profile?.role === 'admin' || profile?.permissions.includes('p_projects');

  // يتم استدعاء كافة الخطافات (useMemo, useEffect) في بداية المكون وقبل أي return
  const filteredProjects = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return projects;
    return projects.filter(p => 
      p.name?.toLowerCase().includes(s) || 
      p.clientName?.toLowerCase().includes(s)
    );
  }, [projects, searchQuery]);

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam) setSearchQuery(qParam);
  }, [searchParams]);

  useEffect(() => {
    if (!db || authLoading || !profile || !hasProjectPermission) {
      if (!authLoading && !hasProjectPermission) setLoading(false);
      return;
    }
    
    let q;
    if (profile.role === 'admin') {
      q = query(collection(db, "projects"));
    } else {
      if (!profile.clientId) {
        setLoading(false);
        return;
      }
      q = query(
        collection(db, "projects"),
        where("clientId", "==", profile.clientId)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData));
      setProjects(docs);
      setLoading(false);
    }, (error: any) => {
      console.error("Projects Access Error:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [profile, authLoading, hasProjectPermission]);

  // جمل العودة المبكرة (Early Returns) تأتي بعد استدعاء كافة الخطافات
  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل مشاريعك...</p>
    </div>
  );

  if (!hasProjectPermission) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-20 w-20 mx-auto mb-6 text-slate-200" />
          <h2 className="text-3xl font-black text-slate-800 mb-2">عذراً، الصلاحية مقيدة</h2>
          <p className="text-slate-500 font-bold">لم يتم منحك صلاحية الوصول للمشاريع حالياً. يرجى مراجعة الإدارة.</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-2xl h-12 px-8 font-black">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const handleSaveProject = async (data: ProjectData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "projects", data.id), data);
        toast({ title: "تم التحديث", description: "تم تعديل بيانات المشروع بنجاح" });
      } else {
        await addDoc(collection(db, "projects"), data);
        toast({ title: "تم البدء", description: "تم إنشاء المشروع الجديد بنجاح" });
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ المشروع", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "تم الحذف", description: "تمت إزالة المشروع نهائياً" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleOpenDetails = (project: ProjectData) => {
    setViewingProject(project);
    setIsDetailsOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {profile?.role === 'client' ? 'مشاريعي الجارية' : 'إدارة المشاريع'}
            </h1>
            <p className="text-slate-500 font-bold">
              {profile?.role === 'client' ? 'تابع مراحل تنفيذ طلباتك لحظة بلحظة' : 'متابعة مراحل التنفيذ والمتطلبات'}
            </p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <Button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
          >
            <Plus className="h-6 w-6" /> إضافة مشروع جديد
          </Button>
        )}
      </header>

      {profile?.role === 'admin' && (
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input 
            placeholder="ابحث باسم المشروع أو اسم العميل..." 
            className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Briefcase className="h-20 w-20" />
            <p className="text-xl font-black">لا توجد مشاريع مرتبطة بحسابك حالياً</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden flex flex-col border border-slate-50 group">
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {project.images?.[0] ? (
                  <img src={project.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <Badge className={`absolute top-4 right-4 rounded-xl font-black ${
                  project.status === 'مكتمل' ? 'bg-green-500' : 'bg-primary'
                }`}>
                  {project.status}
                </Badge>
              </div>

              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black">{project.name}</CardTitle>
                    <p className="text-xs font-bold text-slate-400 mt-1">العميل: {project.clientName}</p>
                  </div>
                  {profile?.role === 'admin' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id!)} className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-400">الإنجاز</span>
                    <span className="text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>

                <Button 
                  onClick={() => handleOpenDetails(project)}
                  variant="outline" 
                  className="w-full rounded-2xl h-12 font-black border-slate-200 gap-2 hover:bg-primary hover:text-white transition-all"
                >
                  <ExternalLink className="h-4 w-4" /> عرض تفاصيل التنفيذ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {profile?.role === 'admin' && (
        <ProjectModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
          onSave={handleSaveProject}
          isLoading={isSaving}
          initialData={editingProject}
        />
      )}

      <ProjectDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setViewingProject(null); }}
        project={viewingProject}
        db={db}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
