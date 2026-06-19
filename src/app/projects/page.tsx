
"use client";

import * as React from "react";
import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  Loader2, 
  Trash2, 
  Home,
  Plus,
  Search,
  User,
  FileText,
  CheckCircle2,
  MoreVertical,
  Edit,
  Clock,
  Check,
  X,
  Eye,
  LogOut
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  collection, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  addDoc, 
  getDocs, 
  where,
  updateDoc,
  limit
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function ProjectsContent() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [previewProject, setPreviewProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    clientPhone: "",
    requirements: "",
    cost: 0,
    deadline: "",
    status: "قيد التنفيذ",
    images: [] as string[],
    steps: [
      { id: 1, title: "تحليل المتطلبات", completed: false },
      { id: 2, title: "التصميم المبدئي", completed: false },
      { id: 3, title: "التطوير والبرمجة", completed: false },
      { id: 4, title: "الاختبار والجودة", completed: false },
      { id: 5, title: "التسليم النهائي", completed: false },
    ]
  });

  const forceEnableScroll = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
    }
  }, []);

  useEffect(() => {
    if (!db || !profile) return;
    
    let projectsQuery;
    if (profile.role === 'admin') {
      projectsQuery = query(collection(db, "projects"));
    } else {
      projectsQuery = query(
        collection(db, "projects"), 
        where("clientId", "==", profile.clientId || profile.uid)
      );
    }

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setProjects(data);
      setLoading(false);

      const projectIdFromUrl = searchParams.get('id');
      if (projectIdFromUrl && data.length > 0) {
        const found = data.find(p => p.id === projectIdFromUrl);
        if (found) {
          setPreviewProject(found);
          setIsPreviewOpen(true);
        }
      }
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [searchParams, profile]);

  const handleClientSearch = async () => {
    if (!formData.clientPhone || !db) return;
    setSearchingClient(true);
    setSearchResults([]);
    try {
      const searchTerm = formData.clientPhone;
      const q = query(
        collection(db, "clients"), 
        where("phone", ">=", searchTerm),
        where("phone", "<=", searchTerm + "\uf8ff"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
        if (results.length === 1) setSelectedClient(results[0]);
      } else {
        toast({ title: "عذراً", description: "لم يتم العثور على أي عملاء بهذا الرقم.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingClient(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsSaving(true);
    const apiKey = "182b7fc61cf92fcbd3094ed2dce7cd27";
    const uploadedUrls: string[] = [...formData.images];
    try {
      for (let i = 0; i < files.length; i++) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", files[i]);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: formDataUpload,
        });
        const result = await response.json();
        if (result.success) uploadedUrls.push(result.data.url);
      }
      setFormData(prev => ({ ...prev, images: uploadedUrls }));
      toast({ title: "تم الرفع", description: "تم رفع الصور بنجاح." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في رفع الصور.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!formData.name || !selectedClient || !db) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال اسم المشروع واختيار عميل.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const completedSteps = formData.steps.filter(s => s.completed).length;
      const progress = Math.round((completedSteps / formData.steps.length) * 100);
      const projectData = {
        ...formData,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        progress: progress,
        updatedAt: serverTimestamp(),
      };
      if (selectedProject) {
        await updateDoc(doc(db, "projects", selectedProject.id), projectData);
        toast({ title: "تم التحديث", description: "تم تحديث بيانات المشروع بنجاح." });
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "نجاح", description: "تمت إضافة المشروع بنجاح." });
      }
      closeModal();
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ المشروع.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStep = async (projectId: string, stepId: number) => {
    if (profile?.role === 'client') {
      toast({ title: "تنبيه", description: "لا تملك صلاحية تعديل مراحل التنفيذ." });
      return;
    }
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newSteps = project.steps.map((s: any) => s.id === stepId ? { ...s, completed: !s.completed } : s);
    const completedSteps = newSteps.filter((s: any) => s.completed).length;
    const progress = Math.round((completedSteps / newSteps.length) * 100);
    setPreviewProject((prev: any) => ({ ...prev, steps: newSteps, progress: progress, status: progress === 100 ? "مكتمل" : "قيد التنفيذ" }));
    try {
      await updateDoc(doc(db, "projects", projectId), {
        steps: newSteps,
        progress: progress,
        status: progress === 100 ? "مكتمل" : "قيد التنفيذ"
      });
    } catch (err) { console.error(err); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setSelectedClient(null);
    setSearchResults([]);
    setFormData({
      name: "", clientPhone: "", requirements: "", cost: 0, deadline: "", status: "قيد التنفيذ", images: [],
      steps: [
        { id: 1, title: "تحليل المتطلبات", completed: false },
        { id: 2, title: "التصميم المبدئي", completed: false },
        { id: 3, title: "التطوير والبرمجة", completed: false },
        { id: 4, title: "الاختبار والجودة", completed: false },
        { id: 5, title: "التسليم النهائي", completed: false },
      ]
    });
    forceEnableScroll();
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewProject(null);
    forceEnableScroll();
    router.replace('/projects', { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-2xl h-14 w-14">
            <Home className="h-7 w-7" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{profile?.role === 'client' ? 'مشروعي' : 'إدارة المشاريع'}</h1>
            <p className="text-muted-foreground font-bold">{profile?.role === 'client' ? 'تتبع مراحل تنفيذ تطبيقك' : 'تتبع الإنجاز، التكاليف، والمواعيد النهائية'}</p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl font-black shadow-lg h-16 px-10 text-lg w-full md:w-auto">
            <Plus className="ml-2 h-7 w-7" /> إضافة مشروع جديد
          </Button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group cursor-pointer" onClick={() => { setPreviewProject(project); setIsPreviewOpen(true); }}>
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {project.images && project.images.length > 0 ? (
                  <Image src={project.images[0]} alt={project.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300"><ImagePlus className="h-12 w-12" /></div>
                )}
                <div className="absolute top-4 right-4 z-20">
                  <Badge className="bg-primary text-white border-none px-4 py-2 rounded-xl font-black">{project.status}</Badge>
                </div>
              </div>
              <CardHeader className="p-8 pb-2">
                <CardTitle className="text-2xl font-black">{project.name}</CardTitle>
                <div className="flex items-center gap-2 text-primary font-black mt-2"><User className="h-5 w-5" /> {project.clientName}</div>
              </CardHeader>
              <CardContent className="p-8">
                <Progress value={project.progress} className="h-3 rounded-full" />
                <div className="flex justify-between mt-2 text-xs font-black text-slate-400"><span>الإنجاز</span><span>{project.progress}%</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* مودال العرض */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="sm:max-w-[1000px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          {previewProject && (
            <>
              <div className="relative w-full aspect-video bg-slate-50 flex items-center justify-center">
                {previewProject.images && previewProject.images.length > 0 ? (
                  <Carousel className="w-full h-full" opts={{ direction: 'rtl' }}>
                    <CarouselContent className="h-full">
                      {previewProject.images.map((img: string, idx: number) => (
                        <CarouselItem key={idx} className="relative aspect-video w-full h-full">
                          <Image src={img} alt="صورة المشروع" fill className="object-contain" sizes="1000px" />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-10 z-50">
                      <CarouselPrevious className="relative h-16 w-16 bg-white/90 shadow-2xl border-none" />
                      <CarouselNext className="relative h-16 w-16 bg-white/90 shadow-2xl border-none" />
                    </div>
                  </Carousel>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300 flex-col gap-4"><ImagePlus className="h-24 w-24" /><p className="font-black text-2xl">لا توجد صور</p></div>
                )}
                <button onClick={closePreview} className="absolute top-8 right-8 z-[60] bg-red-600 text-white p-4 rounded-full border-4 border-white shadow-2xl"><X className="h-8 w-8" /></button>
              </div>

              <ScrollArea className="max-h-[60vh] p-12 bg-white">
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900">{previewProject.name}</h2>
                    <div className="flex items-center gap-3 text-primary font-black text-xl"><User className="h-6 w-6" /> العميل: {previewProject.clientName}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border">
                      <p className="text-xs font-black text-slate-400 mb-2 uppercase">تاريخ التسليم</p>
                      <p className="text-3xl font-black">{previewProject.deadline || "غير محدد"}</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border">
                      <p className="text-xs font-black text-slate-400 mb-2 uppercase">نسبة الإنجاز</p>
                      <p className="text-3xl font-black text-primary">{previewProject.progress}%</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3"><FileText className="h-8 w-8 text-primary" /> مراحل التنفيذ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {previewProject.steps?.map((step: any) => (
                        <div 
                          key={step.id} 
                          onClick={() => toggleStep(previewProject.id, step.id)}
                          className={`flex items-center gap-6 p-6 rounded-[2rem] border cursor-pointer transition-all shadow-md ${step.completed ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          <CheckCircle2 className={`h-8 w-8 ${step.completed ? 'text-green-600' : 'text-slate-200'}`} />
                          <span className="font-black text-xl">{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* زر الخروج أسفل مراحل التنفيذ كما طلب العميل */}
                  <div className="pt-8 pb-10 border-t border-dashed">
                    <Button 
                      onClick={closePreview} 
                      className="w-full rounded-[2.5rem] font-black h-20 text-2xl bg-slate-900 hover:bg-black text-white shadow-2xl flex gap-6"
                    >
                      <LogOut className="h-8 w-8 rotate-180" />
                      إغلاق المشروع والعودة
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* مودال الإضافة والتعديل */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[750px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white" dir="rtl">
          <DialogHeader className="bg-primary p-10 text-primary-foreground">
            <DialogTitle className="text-3xl font-black">إضافة مشروع</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold">تحديث بيانات المشروع والصور والخطوات.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-10 space-y-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 border">
              <Label className="font-black">البحث عن العميل بالهاتف</Label>
              <div className="flex gap-3">
                <Input placeholder="رقم الهاتف..." className="rounded-2xl h-14" value={formData.clientPhone} onChange={(e) => setFormData(p => ({ ...p, clientPhone: e.target.value }))} />
                <Button onClick={handleClientSearch} disabled={searchingClient} className="rounded-2xl h-14">بحث</Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map(c => (
                    <div key={c.id} onClick={() => setSelectedClient(c)} className={`p-4 rounded-xl border cursor-pointer ${selectedClient?.id === c.id ? 'bg-primary text-white' : 'bg-white'}`}>
                      <span className="font-black">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <Input placeholder="اسم المشروع" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-14 rounded-2xl" />
              <Input type="number" placeholder="التكلفة" value={formData.cost} onChange={e => setFormData(p => ({ ...p, cost: Number(e.target.value) }))} className="h-14 rounded-2xl" />
            </div>
          </ScrollArea>
          <DialogFooter className="p-10 bg-slate-50 border-t gap-4">
            <Button onClick={handleSaveProject} disabled={isSaving || !selectedClient} className="rounded-2xl h-16 w-full font-black text-xl">تأكيد الحفظ</Button>
            <Button variant="outline" onClick={closeModal} className="rounded-2xl h-16 w-full font-black text-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
