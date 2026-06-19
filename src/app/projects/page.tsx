
"use client";
import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  Search, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Eye,
  Loader2,
  Calendar,
  Check,
  X
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
  DialogTitle
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
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
    
    const unsub = onSnapshot(collection(db, "projects"), (snapshot) => {
      let projectList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      projectList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (profile?.role === 'client') {
        projectList = projectList.filter(p => p.clientEmail === profile.email || p.clientId === profile.uid);
      }

      setProjects(projectList);
      setLoading(false);

      if (projectIdFromUrl && !isViewModalOpen) {
        const p = projectList.find(p => p.id === projectIdFromUrl);
        if (p) {
          setSelectedProject(p);
          setIsViewModalOpen(true);
        }
      }
    });
    return () => unsub();
  }, [profile, projectIdFromUrl, isViewModalOpen]);

  const toggleStep = async (projectId: string, stepId: number) => {
    if (profile?.role !== 'admin') return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedSteps = project.steps?.map((s: any) => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    ) || [];
    
    const completedSteps = updatedSteps.filter((s: any) => s.completed).length;
    const progress = Math.round((completedSteps / updatedSteps.length) * 100);

    try {
      await updateDoc(doc(db!, "projects", projectId), {
        steps: updatedSteps,
        progress: progress,
        status: progress === 100 ? "مكتمل" : "قيد التنفيذ"
      });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحديث البيانات.", variant: "destructive" });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">المشاريع</h1>
          <p className="text-slate-500 font-bold">تتبع حالة التنفيذ والخطوات المكتملة</p>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث باسم المشروع..." 
          className="pr-12 h-14 rounded-2xl border-none shadow-sm bg-white font-bold text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <Badge className={project.status === "مكتمل" ? "bg-green-500 font-black" : "bg-blue-600 font-black"}>
                  {project.status}
                </Badge>
                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(project.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <CardTitle className="text-xl font-black text-slate-800">{project.name}</CardTitle>
              <CardDescription className="font-bold">الموعد المتوقع: {project.deadline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500">الإنجاز</span>
                  <span className="text-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2 rounded-full" />
              </div>
              <Button 
                onClick={() => { setSelectedProject(project); setIsViewModalOpen(true); }}
                className="w-full rounded-2xl h-12 font-black gap-2 shadow-md"
              >
                <Eye className="h-5 w-5" /> تفاصيل التنفيذ
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <div className="bg-primary p-10 text-primary-foreground relative">
             <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsViewModalOpen(false)}
              className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black">{selectedProject?.name}</DialogTitle>
              <p className="opacity-80 font-bold mt-2">متابعة مراحل العمل والجدول الزمني</p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh] p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" /> مراحل التنفيذ الحالية
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedProject?.steps?.map((step: any) => (
                    <div 
                      key={step.id} 
                      onClick={() => toggleStep(selectedProject.id, step.id)}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                        step.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <span className={`text-lg font-black ${step.completed ? 'text-green-700' : 'text-slate-600'}`}>
                        {step.title}
                      </span>
                      {step.completed ? <Check className="h-6 w-6 text-green-500" /> : <Clock className="h-5 w-5 text-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* زر الإغلاق الموحد أسفل المراحل مباشرة كما طلب العميل */}
              <div className="pt-4 pb-4">
                <Button 
                  onClick={() => setIsViewModalOpen(false)}
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
