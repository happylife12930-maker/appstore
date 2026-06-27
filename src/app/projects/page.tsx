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
import { useTranslation } from "@/components/language-provider";

function ProjectsContent() {
  const { t, dir } = useTranslation();
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

  useEffect(() => {
    if (!db || authLoading || !profile || !hasProjectPermission) {
      if (!authLoading) setLoading(false);
      return;
    }
    let q = profile.role === 'admin' ? query(collection(db, "projects")) : query(collection(db, "projects"), where("clientId", "==", profile.clientId || "null"));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [profile, authLoading, hasProjectPermission]);

  if (authLoading || loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  if (!hasProjectPermission) {
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

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'مكتمل' || p.status === 'Completed').length,
    active: projects.length - projects.filter(p => p.status === 'مكتمل' || p.status === 'Completed').length
  };

  const filteredProjects = projects.filter(p => {
    const s = searchQuery.toLowerCase().trim();
    const matchesSearch = !s || p.name?.toLowerCase().includes(s) || p.clientName?.toLowerCase().includes(s);
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'completed' ? (p.status === 'مكتمل' || p.status === 'Completed') : (p.status !== 'مكتمل' && p.status !== 'Completed');
    return matchesSearch && matchesStatus;
  });

  const handleSaveProject = async (data: ProjectData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) await setDoc(doc(db, "projects", data.id), data);
      else await addDoc(collection(db, "projects"), data);
      setIsModalOpen(false);
      setEditingProject(null);
      toast({ title: t('login_success') });
    } catch (err) { toast({ title: "Error", variant: "destructive" }); } finally { setIsSaving(false); }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db || !confirm(t('delete') + "?")) return;
    try { await deleteDoc(doc(db, "projects", id)); toast({ title: t('delete') }); } catch (err) {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Briefcase className="h-8 w-8" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">{profile?.role === 'admin' ? t('projects_title') : t('my_projects')}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('projects_subtitle')}</p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="rounded-2xl h-14 px-8 font-black text-lg gap-2 bg-primary shadow-xl hover:scale-105 transition-all">
            <Plus className="h-6 w-6" /> {t('add_project')}
          </Button>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
          <TabsList className="bg-white border p-1 h-14 rounded-2xl shadow-sm gap-2">
            <TabsTrigger value="all" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
              <Layers className="h-4 w-4" /> {t('all_projects')} 
              <Badge variant={statusFilter === 'all' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all gap-2">
              <Clock className="h-4 w-4" /> {t('status_in_progress')} 
              <Badge variant={statusFilter === 'active' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl h-11 px-6 font-black text-sm data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all gap-2">
              <CheckCircle2 className="h-4 w-4" /> {t('status_completed')} 
              <Badge variant={statusFilter === 'completed' ? 'secondary' : 'outline'} className="rounded-lg h-5 px-1.5 text-[10px]">{stats.completed}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input placeholder={t('search_projects')} className="pr-12 h-14 rounded-2xl font-bold text-base border-none shadow-sm bg-white focus-visible:ring-primary/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((p) => (
          <Card key={p.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all bg-white overflow-hidden flex flex-col border border-slate-50 group">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-12 w-12" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Badge className={`absolute top-5 right-5 rounded-xl px-4 py-1 font-black shadow-lg ${p.status === 'مكتمل' || p.status === 'Completed' ? 'bg-green-500' : 'bg-primary'}`}>{p.status}</Badge>
            </div>
            <CardHeader className="p-7 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-black truncate text-slate-800">{p.name}</CardTitle>
                  <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t('client_name')}: {p.clientName}
                  </p>
                </div>
                {profile?.role === 'admin' && (
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="icon" onClick={() => { setEditingProject(p); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteProject(p.id!)} className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-7 pt-2 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-400">{t('progress')}</span>
                  <span className={`px-2 py-0.5 rounded-lg ${p.progress === 100 ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>{p.progress}%</span>
                </div>
                <Progress value={p.progress} className={`h-2.5 rounded-full bg-slate-100 ${p.progress === 100 ? '[&>div]:bg-green-500' : ''}`} />
              </div>
              <Button onClick={() => { setViewingProject(p); setIsDetailsOpen(true); }} variant="outline" className="w-full rounded-2xl h-14 font-black border-2 border-slate-100 gap-3 hover:bg-primary hover:text-white transition-all shadow-sm">
                <ExternalLink className="h-5 w-5" /> {t('view_details')}
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

export default function ProjectsPage() { return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><ProjectsContent /></Suspense>; }
