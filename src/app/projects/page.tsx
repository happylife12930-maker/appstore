"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc } from "firebase/firestore";
import { ProjectModal, type ProjectData } from "@/components/modals/project-modal";
import { ProjectDetailsModal } from "@/components/modals/project-details-modal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<ProjectData | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectData)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProjects = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.name?.toLowerCase().includes(s) || 
      p.clientName?.toLowerCase().includes(s)
    );
  }, [projects, searchQuery]);

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
      setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 150);
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل قائمة المشاريع...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المشاريع</h1>
            <p className="text-slate-500 font-bold">متابعة مراحل التنفيذ والمتطلبات التقنية</p>
          </div>
        </div>
        <Button 
          onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
          className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="h-6 w-6" /> إضافة مشروع جديد
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث باسم المشروع أو اسم العميل..." 
          className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Briefcase className="h-20 w-20" />
            <p className="text-xl font-black">لا توجد مشاريع حالية</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden flex flex-col group border border-slate-50">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {project.images?.[0] ? (
                  <img src={project.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={project.name} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <ImageIcon className="h-12 w-12" />
                    <span className="font-bold text-xs uppercase">بدون صورة غلاف</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className={`rounded-xl font-black px-3 py-1 border-none backdrop-blur-sm ${
                    project.status === 'مكتمل' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-primary'
                  }`}>
                    {project.status}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-xl font-black mb-1">{project.name}</CardTitle>
                    <p className="text-xs font-bold text-slate-400">العميل: {project.clientName}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="h-9 w-9 rounded-xl">
                      <Edit3 className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id!)} className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400">نسبة الإنجاز</span>
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2 rounded-full" />
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-black text-xs">نظرة على المتطلبات</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 line-clamp-2">
                      {project.requirements || 'لا توجد تفاصيل متوفرة حالياً للمتطلبات.'}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleOpenDetails(project)}
                  variant="outline" 
                  className="w-full rounded-2xl h-12 font-black border-slate-200 mt-4 gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" /> عرض ملف المشروع
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* مودال الإضافة والتعديل */}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        isLoading={isSaving}
        initialData={editingProject}
      />

      {/* مودال عرض التفاصيل ومراحل التنفيذ */}
      <ProjectDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setViewingProject(null); }}
        project={viewingProject}
        db={db}
      />
    </div>
  );
}
