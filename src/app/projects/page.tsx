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

  const hasProjectPermission = profile?.role === 'admin' || (profile?.permissions || []).includes('p_projects');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'active') setStatusFilter('active');
    else if (statusParam === 'finished') setStatusFilter('completed');

    const qParam = searchParams.get('q');
    if (qParam) setSearchQuery(qParam);
  }, [searchParams]);

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
      q = query(collection(db, "projects"), where("clientId", "==", profile.clientId));
    }

    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData)));
      setLoading(false);
    }, (error) => {
      console.warn("Projects Access Denied:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [profile, authLoading, hasProjectPermission]);

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">جاري تحميل مشاريعك...</p>
    </div>
  );

  if (!hasProjectPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-dashed">
          <Lock className="h-12 w-12 mx-auto mb-4 text-slate-200" />
          <h2 className="text-xl font-black text-slate-800">صلاحية مقيدة</h2>
          <p className="text-xs text-slate-500 font-bold mt-2">يرجى مراجعة الإدارة لمنحك صلاحية الوصول.</p>
          <Button onClick={() => router.push("/")} className="mt-6 rounded-xl h-10 px-6 font-black text-xs">العودة للرئيسية</Button>
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
        toast({ title: "تم التحديث بنجاح" });
      } else {
        await addDoc(collection(db, "projects"), data);
        toast({ title: "تم إنشاء المشروع بنجاح" });
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db || !confirm("حذف المشروع؟")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "تم الحذف" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[1.5rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Briefcase className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{profile?.role === 'client' ? 'مشاريعي' : 'إدارة المشاريع'}</h1>
            <p className="text-[10px] text-slate-500 font-bold">متابعة مراحل التنفيذ والمتطلبات</p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="rounded-xl h-11 px-6 font-black text-sm gap-2 shadow-md">
            <Plus className="h-5 w-5" /> إضافة مشروع
          </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
          <TabsList className="bg-white border p-1 h-12 rounded-xl shadow-sm">
            <TabsTrigger value="all" className="rounded-lg h-9 px-4 font-black text-xs gap-2">
              <Layers className="h-3.5 w-3.5" /> الكل <Badge variant="secondary" className="h-5 px-1.5 text-[9px]">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg h-9 px-4 font-black text-xs gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Clock className="h-3.5 w-3.5" /> جاري <Badge variant="outline" className="h-5 px-1.5 text-[9px] text-inherit border-current">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg h-9 px-4 font-black text-xs gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <CheckCircle2 className="h-3.5 w-3.5" /> مكتمل <Badge variant="outline" className="h-5 px-1.5 text-[9px] text-inherit border-current">{stats.completed}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-[350px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="ابحث باسم المشروع أو العميل..." 
            className="pr-10 h-12 rounded-xl font-bold text-sm border-none shadow-sm bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden flex flex-col group">
            <div className="relative h-40 bg-slate-100 overflow-hidden">
              {project.images?.[0] ? (
                <img src={project.images[0]} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>
              )}
              <Badge className={`absolute top-4 right-4 rounded-lg px-2 py-0.5 font-black text-[9px] shadow-sm ${project.status === 'مكتمل' ? 'bg-green-500' : 'bg-primary'}`}>
                {project.status}
              </Badge>
            </div>
            <CardHeader className="p-5 pb-1">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-black truncate">{project.name}</CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">العميل: {project.clientName}</p>
                </div>
                {profile?.role === 'admin' && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="h-7 w-7 rounded-lg text-slate-400 hover:text-primary"><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id!)} className="h-7 w-7 rounded-lg text-rose-300 hover:text-rose-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                  <span className="text-slate-400">الإنجاز</span>
                  <span className={project.progress === 100 ? 'text-green-600' : 'text-primary'}>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className={`h-1.5 rounded-full bg-slate-100 ${project.progress === 100 ? '[&>div]:bg-green-500' : ''}`} />
              </div>
              <Button onClick={() => { setViewingProject(project); setIsDetailsOpen(true); }} variant="outline" className="w-full rounded-xl h-10 font-black text-xs border-slate-100 hover:bg-primary hover:text-white gap-2 transition-all">
                <ExternalLink className="h-4 w-4" /> عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} isLoading={isSaving} initialData={editingProject} />
      <ProjectDetailsModal isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); setViewingProject(null); }} project={viewingProject} db={db} />
    </div>
  );
}

export default function ProjectsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><ProjectsContent /></Suspense>;
}
