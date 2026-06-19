
"use client";
import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X,
  ChevronRight,
  Eye,
  Loader2,
  Calendar,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('id');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    
    // جلب البيانات بدون ترتيب Firestore معقد لتجنب خطأ Index
    const q = collection(db, "projects");
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let projectList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // الترتيب والتصفية برمجياً (Client-side)
      projectList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (profile?.role === 'client') {
        projectList = projectList.filter(p => p.clientEmail === profile.email);
      }

      setProjects(projectList);
      setLoading(false);

      if (projectIdFromUrl) {
        const p = projectList.find(p => p.id === projectIdFromUrl);
        if (p) {
          setSelectedProject(p);
          setIsViewModalOpen(true);
        }
      }
    });
    return () => unsubscribe();
  }, [profile, projectIdFromUrl]);

  const toggleStep = async (projectId: string, stepId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Optimistic Update: فوري
    const updatedSteps = project.steps?.map((s: any) => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    ) || [];
    
    const completedSteps = updatedSteps.filter((s: any) => s.completed).length;
    const progress = Math.round((completedSteps / updatedSteps.length) * 100);

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, steps: updatedSteps, progress } : p));
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev: any) => ({ ...prev, steps: updatedSteps, progress }));
    }

    try {
      await updateDoc(doc(db!, "projects", projectId), {
        steps: updatedSteps,
        progress: progress,
        status: progress === 100 ? "مكتمل" : "قيد التنفيذ"
      });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحديث الخطوة.", variant: "destructive" });
    }
  };

  const forceEnableScroll = () => {
    document.body.style.overflow = 'unset';
    document.body.style.pointerEvents = 'auto';
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">إدارة المشاريع</h1>
          <p className="text-slate-500 font-bold">تتبع حالة التنفيذ والخطوات المتبقية</p>
        </div>
        {profile?.role === 'admin' && (
          <Button className="rounded-2xl h-12 px-6 font-black shadow-lg gap-2">
            <Plus className="h-5 w-5" /> مشروع جديد
          </Button>
        )}
      </header>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="ابحث باسم المشروع أو العميل..." 
              className="pr-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge className={project.status === "مكتمل" ? "bg-green-500 font-black" : "bg-blue-600 font-black"}>
                  {project.status}
                </Badge>
                <span className="text-xs font-black text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(project.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <CardTitle className="text-xl font-black mt-2 text-slate-800">{project.name}</CardTitle>
              <CardDescription className="font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" /> الموعد: {project.deadline}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-black text-slate-500">نسبة الإنجاز</span>
                  <span className="font-black text-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2 rounded-full" />
              </div>
              <Button 
                onClick={() => { setSelectedProject(project); setIsViewModalOpen(true); }}
                className="w-full rounded-2xl h-12 font-black gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Eye className="h-5 w-5" /> عرض مراحل التنفيذ
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={(open) => { 
        if(!open) { setIsViewModalOpen(false); forceEnableScroll(); }
      }}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <div className="bg-primary p-10 text-primary-foreground relative">
            <button 
              onClick={() => { setIsViewModalOpen(false); forceEnableScroll(); }}
              className="absolute top-6 left-6 h-12 w-12 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black">{selectedProject?.name}</DialogTitle>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[70vh] p-8">
            <div className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" /> مراحل التنفيذ
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedProject?.steps?.map((step: any) => (
                    <div 
                      key={step.id} 
                      onClick={() => toggleStep(selectedProject.id, step.id)}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                        step.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                      }`}
                    >
                      <span className={`text-lg font-black ${step.completed ? 'text-green-700' : 'text-slate-600'}`}>
                        {step.title}
                      </span>
                      {step.completed ? <Check className="h-6 w-6 text-green-500 font-black" /> : <Clock className="h-5 w-5 text-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* زر الإغلاق الضخم أسفل مراحل التنفيذ كما طلب العميل */}
              <div className="pt-6">
                <Button 
                  onClick={() => { setIsViewModalOpen(false); forceEnableScroll(); }}
                  className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ChevronRight className="h-6 w-6" /> إغلاق ومعاودة العمل
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
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
