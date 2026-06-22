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
  Lock,
  CheckCircle2,
  Clock,
  Layers
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProjectsContent() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Apply filters from URL search params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'active') {
      setStatusFilter('active');
    } else if (statusParam === 'finished') {
      setStatusFilter('completed');
    }

    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  // حساب الإحصائيات للفلترة
  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'مكتمل').length;
    const active = total - completed;
    return { total, completed, active };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      const matchesSearch = !s || p.name?.toLowerCase().includes(s) || p.clientName?.toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'completed' 
          ? p.status === 'مكتمل' 
          : p.status !== 'مكتمل';
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
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
            className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all bg-primary"
          >
            <Plus className="h-6 w-6" /> إضافة مشروع جديد
          </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        {/* نظام الفلترة الاحترافي */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
          <TabsList className="bg-white border p-1 h-14 rounded-2xl shadow-sm gap-2">
            <TabsTrigger value="all" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Layers className="h-4 w-4" /> الكل
              <Badge variant={statusFilter === 'all' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all gap-2">
              <Clock className="h-4 w-4" /> جاري التنفيذ
              <Badge variant={statusFilter === 'active' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all gap-2">
              <CheckCircle2 className="h-4 w-4" /> مكتمل
              <Badge variant={statusFilter === 'completed' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.completed}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* محرك البحث */}
        <div className="relative w-full lg:w-[400px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input 
            placeholder="ابحث باسم المشروع أو العميل..." 
            className="pr-12 h-14 rounded-2xl font-bold text-base border-none shadow-sm bg-white focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-24 text-center bg-white border-2 border-dashed border-slate-100">
          <div className="flex flex-col items-center gap-4 opacity-30">
            <Briefcase className="h-20 w-20" />
            <p className="text-2xl font-black">
              {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'لا توجد مشاريع في هذا القسم حالياً'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all bg-white overflow-hidden flex flex-col border border-slate-50 group">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {project.images?.[0] ? (
                  <img src={project.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Badge className={`absolute top-5 right-5 rounded-xl px-4 py-1 font-black shadow-lg ${
                  project.status === 'مكتمل' ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
                }`}>
                  {project.status}
                </Badge>
              </div>

              <CardHeader className="p-7 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-black truncate text-slate-800">{project.name}</CardTitle>
                    <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> العميل: {project.clientName}
                    </p>
                  </div>
                  {profile?.role === 'admin' && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="icon" onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl border-slate-100 hover:bg-primary/5 text-slate-400 hover:text-primary transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteProject(project.id!)} className="h-9 w-9 rounded-xl border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-7 pt-2 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-400 uppercase tracking-widest">إجمالي الإنجاز</span>
                    <span className={`px-2 py-0.5 rounded-lg ${project.progress === 100 ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className={`h-2.5 rounded-full bg-slate-100 ${project.progress === 100 ? '[&>div]:bg-green-500' : ''}`} />
                </div>

                <Button 
                  onClick={() => handleOpenDetails(project)}
                  variant="outline" 
                  className="w-full rounded-2xl h-14 font-black border-2 border-slate-100 gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
                >
                  <ExternalLink className="h-5 w-5" /> عرض تفاصيل التنفيذ
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
