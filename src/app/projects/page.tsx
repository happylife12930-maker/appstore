"use client";
import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  Search, 
  Clock, 
  ChevronRight,
  Eye,
  Loader2,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { ProjectModal, ProjectData } from "@/components/modals/project-modal";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('id');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snapshot) => {
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      
      if (profile?.role === 'client') {
        list = list.filter(p => p.clientEmail === profile.email || p.clientId === profile.uid);
      }
      
      setProjects(list);
      setLoading(false);

      if (projectIdFromUrl && !isViewModalOpen && !selectedProject) {
        const p = list.find(p => p.id === projectIdFromUrl);
        if (p) { setSelectedProject(p); setIsViewModalOpen(true); }
      }
    });
    return () => unsub();
  }, [profile, projectIdFromUrl]);

  const handleSaveProject = async (data: ProjectData) => {
    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateDoc(doc(db!, "projects", editingProject.id), { ...data });
        toast({ title: "تم التحديث", description: "تم تحديث بيانات المشروع بنجاح." });
      } else {
        await addDoc(collection(db!, "projects"), { 
          ...data, 
          createdAt: Date.now(),
          progress: 0 
        });
        toast({ title: "تم الإضافة", description: "تم بدء المشروع الجديد بنجاح." });
      }
      setIsProjectModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل حفظ البيانات.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 300);
    }
  };

  const toggleStep = async (projectId: string, stepId: number) => {
    if (profile?.role !== 'admin') return;

    const currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) return;

    const updatedSteps = currentProject.steps?.map((s: any) => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    ) || [];
    
    const doneCount = updatedSteps.filter((s: any) => s.completed).length;
    const prog = Math.round((doneCount / updatedSteps.length) * 100);

    try {
      await updateDoc(doc(db!, "projects", projectId), {
        steps: updatedSteps,
        progress: prog,
        status: prog === 100 ? "مكتمل" : "قيد التنفيذ"
      });
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev: any) => ({ ...prev, steps: updatedSteps, progress: prog }));
      }
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحديث المرحلة.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return projects.filter(p => 
      (p.name || "").toLowerCase().includes(s) || 
      (p.clientName || "").toLowerCase().includes(s)
    );
  }, [projects, searchQuery]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" /> خارطة المشروعات
          </h1>
          <p className="text-slate-500 font-bold">متابعة مراحل التنفيذ والإنجاز اللحظي</p>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => { setEditingProject(null); setIsProjectModalOpen(true); }} className="rounded-2xl h-14 font-black shadow-lg gap-2 px-8 w-full md:w-auto">
            <Plus className="h-6 w-6" /> إضافة مشروع جديد
          </Button>
        )}
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <input 
          placeholder="ابحث باسم المشروع أو العميل..." 
          className="w-full pr-12 h-16 rounded-[1.5rem] border-none shadow-sm bg-white font-bold text-xl focus:ring-2 focus:ring-primary/20 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((project) => (
          <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all bg-white overflow-hidden group">
            {project.images?.[0] && (
              <div className="aspect-video w-full overflow-hidden relative">
                <img src={project.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <Badge className="absolute top-4 left-4 bg-primary/80 backdrop-blur font-black">
                  <ImageIcon className="h-3 w-3 ml-1" /> {project.images.length}
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className={project.status === "مكتمل" ? "bg-green-600 font-black px-4" : "bg-blue-600 font-black px-4"}>
                  {project.status}
                </Badge>
                {profile?.role === 'admin' && (
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setIsProjectModalOpen(true); }} className="rounded-full h-10 w-10">
                    <Edit3 className="h-4 w-4 text-slate-400" />
                  </Button>
                )}
              </div>
              <CardTitle className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">{project.name}</CardTitle>
              <CardDescription className="font-bold text-slate-400">العميل: {project.clientName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>نسبة الإنجاز</span>
                  <span className="text-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-3 rounded-full bg-slate-100" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setSelectedProject(project); setIsViewModalOpen(true); }} className="flex-1 rounded-2xl h-14 font-black gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                  <Eye className="h-5 w-5" /> عرض المراحل
                </Button>
                {profile?.role === 'admin' && (
                  <Button variant="outline" size="icon" onClick={async () => { if(confirm("حذف المشروع؟")) await deleteDoc(doc(db!, "projects", project.id)) }} className="rounded-2xl h-14 w-14 border-slate-200 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <div className="bg-primary p-10 text-primary-foreground relative">
             <Button variant="ghost" size="icon" onClick={() => setIsViewModalOpen(false)} className="absolute left-6 top-6 text-white hover:bg-white/20 rounded-full h-10 w-10">
              <X className="h-6 w-6 text-rose-200" />
            </Button>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black">{selectedProject?.name}</DialogTitle>
              <p className="opacity-80 font-bold mt-2">خطة العمل والخطوات التنفيذية</p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh] p-8">
            <div className="space-y-8">
              {selectedProject?.requirements && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> المتطلبات التقنية
                  </h4>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed whitespace-pre-line">{selectedProject.requirements}</p>
                </div>
              )}

              {selectedProject?.images?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" /> معرض الصور
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.images.map((img: string, i: number) => (
                      <img key={i} src={img} className="rounded-3xl w-full aspect-video object-cover border shadow-sm" alt="" />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" /> مراحل التنفيذ
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {selectedProject?.steps?.map((step: any) => (
                    <div 
                      key={step.id} 
                      onClick={() => toggleStep(selectedProject.id, step.id)}
                      className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${
                        step.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'
                      } ${profile?.role === 'admin' ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'}`}
                    >
                      <span className={`text-lg font-black ${step.completed ? 'text-green-700' : 'text-slate-600'}`}>
                        {step.title}
                      </span>
                      {step.completed ? (
                        <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                          <Check className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                          <Clock className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* زر الخروج الضخم أسفل المراحل مباشرة */}
              <div className="pt-6">
                <Button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" /> إغلاق ومعاودة العمل
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} 
        onSave={handleSaveProject}
        isLoading={isSubmitting}
        initialData={editingProject}
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