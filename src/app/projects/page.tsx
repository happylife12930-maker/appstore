"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Briefcase, Plus, Search, Edit3, Trash2, ExternalLink, Image as ImageIcon, Loader2, X, Lock, CheckCircle2, Clock, Layers
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
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'completed' ? p.status === 'مكتمل' : p.status !== 'مكتمل';
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  useEffect(() => {
    if (!db || authLoading || !profile || !hasProjectPermission) {
      if (!authLoading && !hasProjectPermission) setLoading(false);
      return;
    }
    let q = profile.role === 'admin' ? query(collection(db, "projects")) : query(collection(db, "projects"), where("clientId", "==", profile.clientId || "null"));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [profile, authLoading, hasProjectPermission]);

  const handleSaveProject = async (data: ProjectData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) await setDoc(doc(db, "projects", data.id), data);
      else await addDoc(collection(db, "projects"), data);
      setIsModalOpen(false);
      setEditingProject(null);
      toast({ title: "تم الحفظ بنجاح" });
    } catch (err) { toast({ title: "خطأ", variant: "destructive" }); } finally { setIsSaving(false); }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db || !confirm("حذف المشروع؟")) return;
    try { await deleteDoc(doc(db, "projects", id)); toast({ title: "تم الحذف" }); } catch (err) {}
  };

  if (loading || authLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Briefcase className="h-7 w-7" /></div>
          <div><h1 className="text-2xl font-black text-slate-800">إدارة المشاريع</h1><p className="text-[10px] text-slate-500 font-bold uppercase">متابعة مراحل التنفيذ</p></div>
        </div>
        {profile?.role === 'admin' && <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="rounded-xl h-11 px-6 font-black text-sm gap-2 bg-primary"><Plus className="h-5 w-5" /> إضافة مشروع</Button>}
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
          <TabsList className="bg-white border p-1 h-12 rounded-xl shadow-sm gap-2">
            <TabsTrigger value="all" className="rounded-lg h-9 px-4 font-black text-xs transition-all gap-2"><Layers className="h-4 w-4" /> الكل <Badge variant="secondary" className="rounded-md h-4 px-1 text-[8px]">{stats.total}</Badge></TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg h-9 px-4 font-black text-xs transition-all gap-2"><Clock className="h-4 w-4" /> جاري <Badge variant="secondary" className="rounded-md h-4 px-1 text-[8px]">{stats.active}</Badge></TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg h-9 px-4 font-black text-xs transition-all gap-2"><CheckCircle2 className="h-4 w-4" /> مكتمل <Badge variant="secondary" className="rounded-md h-4 px-1 text-[8px]">{stats.completed}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input placeholder="بحث..." className="pr-10 h-11 rounded-xl font-bold text-xs bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <Card key={p.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden flex flex-col border group">
            <div className="relative h-40 bg-slate-100 overflow-hidden">
              {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>}
              <Badge className={`absolute top-4 right-4 rounded-lg px-3 py-0.5 text-[9px] font-black ${p.status === 'مكتمل' ? 'bg-green-500' : 'bg-primary'}`}>{p.status}</Badge>
            </div>
            <CardHeader className="p-5 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0"><CardTitle className="text-base font-black truncate">{p.name}</CardTitle><p className="text-[10px] font-bold text-slate-400 mt-1">العميل: {p.clientName}</p></div>
                {profile?.role === 'admin' && <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="h-8 w-8 text-slate-400"><Edit3 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteProject(p.id!)} className="h-8 w-8 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></Button></div>}
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">الإنجاز</span><span className={p.progress === 100 ? 'text-green-600' : 'text-primary'}>{p.progress}%</span></div>
                <Progress value={p.progress} className={`h-1.5 rounded-full bg-slate-100 ${p.progress === 100 ? '[&>div]:bg-green-500' : ''}`} />
              </div>
              <Button onClick={() => { setViewingProject(p); setIsDetailsOpen(true); }} variant="outline" className="w-full rounded-xl h-11 font-black text-xs border-2 border-slate-100 gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"><ExternalLink className="h-4 w-4" /> عرض التفاصيل</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} isLoading={isSaving} initialData={editingProject} />
      <ProjectDetailsModal isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); setViewingProject(null); }} project={viewingProject} db={db} />
    </div>
  );
}

export default function ProjectsPage() { return <Suspense fallback={<Loader2 className="animate-spin" />}><ProjectsContent /></Suspense>; }