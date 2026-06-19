
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  Loader2, 
  Trash2, 
  Home,
  Plus,
  Search,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  MoreVertical,
  ExternalLink,
  Edit,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  collection, 
  query, 
  orderBy, 
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
import { useRouter } from "next/navigation";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProjectsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

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

  useEffect(() => {
    if (!db) return;
    const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        if (results.length === 1) {
          setSelectedClient(results[0]);
          toast({ title: "تم العثور على عميل", description: results[0].name });
        } else {
          toast({ title: "نتائج متعددة", description: `تم العثور على ${results.length} عملاء.` });
        }
      } else {
        setSearchResults([]);
        setSelectedClient(null);
        toast({ title: "عذراً", description: "لم يتم العثور على أي عملاء بهذا الرقم.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل البحث في قاعدة البيانات.", variant: "destructive" });
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
        if (result.success) {
          uploadedUrls.push(result.data.url);
        }
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
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال اسم المشروع واختيار عميل من نتائج البحث.", variant: "destructive" });
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
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects"), projectData);
      toast({ title: "نجاح", description: "تمت إضافة المشروع بنجاح." });
      setIsModalOpen(false);
      setFormData({
        name: "", clientPhone: "", requirements: "", cost: 0, deadline: "", status: "قيد التنفيذ", images: [],
        steps: formData.steps.map(s => ({ ...s, completed: false }))
      });
      setSelectedClient(null);
      setSearchResults([]);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ المشروع.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStep = async (projectId: string, stepId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newSteps = project.steps.map((s: any) => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const completedSteps = newSteps.filter((s: any) => s.completed).length;
    const progress = Math.round((completedSteps / newSteps.length) * 100);

    try {
      await updateDoc(doc(db, "projects", projectId), {
        steps: newSteps,
        progress: progress,
        status: progress === 100 ? "مكتمل" : "قيد التنفيذ"
      });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في تحديث الحالة.", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في الحذف.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl h-12 w-12">
            <Home className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">إدارة المشاريع</h1>
            <p className="text-muted-foreground font-medium">تتبع الإنجاز، التكاليف، والارتباط بالعملاء</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl font-black shadow-lg h-14 px-8 text-lg w-full md:w-auto">
          <Plus className="ml-2 h-6 w-6" /> إضافة مشروع جديد
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="rounded-3xl border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
              {/* معرض الصور المطور */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {project.images && project.images.length > 0 ? (
                  <Carousel className="w-full h-full">
                    <CarouselContent className="h-full ml-0">
                      {project.images.map((img: string, idx: number) => (
                        <CarouselItem key={idx} className="h-full pl-0 relative">
                          <Image 
                            src={img} 
                            alt={`${project.name} ${idx + 1}`} 
                            fill 
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {project.images.length > 1 && (
                      <>
                        <CarouselPrevious className="right-4 left-auto bg-black/30 hover:bg-black/50 text-white border-none h-8 w-8" />
                        <CarouselNext className="left-4 right-auto bg-black/30 hover:bg-black/50 text-white border-none h-8 w-8" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-[10px] text-white font-black z-10">
                          {project.images.length} صور
                        </div>
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300"><ImagePlus className="h-12 w-12" /></div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <Badge className={`border-none shadow-lg px-3 py-1 font-black ${project.progress === 100 ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                    {project.status}
                  </Badge>
                </div>
                
                <div className="absolute left-4 top-4 z-20">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur shadow-lg">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" dir="rtl" className="font-bold rounded-2xl p-2 shadow-2xl border-none">
                      <DropdownMenuItem onClick={() => router.push(`/clients/${project.clientId}/statement`)} className="gap-3 cursor-pointer py-3 rounded-xl hover:bg-slate-50">
                        <User className="h-5 w-5 text-primary" /> فتح بروفايل العميل
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl hover:bg-slate-50">
                        <Edit className="h-5 w-5 text-blue-500" /> تعديل تفاصيل المشروع
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="gap-3 text-red-600 cursor-pointer py-3 rounded-xl focus:bg-red-50 focus:text-red-600">
                        <Trash2 className="h-5 w-5" /> حذف المشروع نهائياً
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm mt-1">
                      <User className="h-4 w-4" /> {project.clientName}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-green-600">{(project.cost || 0).toLocaleString('ar-EG')} ج.م</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                    <span>نسبة الإنجاز</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                      <Clock className="h-3 w-3" /> موعد التسليم
                    </div>
                    <div className="text-sm font-black text-slate-700">{project.deadline || "غير محدد"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                      <FileText className="h-3 w-3" /> المتطلبات
                    </div>
                    <div className="text-sm font-bold text-slate-700 truncate">{project.requirements || "لا يوجد"}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase">خطوات العمل التفاعلية</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {project.steps?.map((step: any) => (
                      <div 
                        key={step.id} 
                        onClick={() => toggleStep(project.id, step.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${step.completed ? 'bg-green-50 border-green-100 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'}`}
                      >
                        <CheckCircle2 className={`h-5 w-5 transition-colors ${step.completed ? 'text-green-600' : 'text-slate-300'}`} />
                        <span className="text-xs font-black">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* مودال إضافة مشروع جديد */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">إضافة مشروع جديد للوكالة</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-bold mt-1">اربط المشروع بعميل وحدد المتطلبات والتكاليف بدقة.</DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[75vh] p-8">
            <div className="space-y-8">
              {/* البحث عن العميل */}
              <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                <Label className="font-black text-slate-800 flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" /> البحث عن العميل بجزء من الرقم
                </Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="اكتب جزء من رقم الهاتف..." 
                    className="rounded-2xl h-12 border-slate-200 font-bold" 
                    value={formData.clientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  />
                  <Button onClick={handleClientSearch} disabled={searchingClient} className="rounded-2xl h-12 px-6 font-black">
                    {searchingClient ? <Loader2 className="animate-spin" /> : "بحث"}
                  </Button>
                </div>

                {/* قائمة نتائج البحث */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-black text-slate-400 uppercase">نتائج البحث:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {searchResults.map((client) => (
                        <div 
                          key={client.id} 
                          onClick={() => setSelectedClient(client)}
                          className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedClient?.id === client.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white border-slate-100 hover:bg-slate-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${selectedClient?.id === client.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-black text-sm">{client.name}</p>
                              <p className={`text-xs ${selectedClient?.id === client.id ? 'text-white/80' : 'text-slate-400'}`} dir="ltr">{client.phone}</p>
                            </div>
                          </div>
                          {selectedClient?.id === client.id && <Check className="h-5 w-5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedClient && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in-95">
                    <div className="p-3 bg-green-600 text-white rounded-xl"><CheckCircle2 className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-bold text-green-600">العميل المختار:</p>
                      <p className="font-black text-green-800 text-lg">{selectedClient.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black">اسم المشروع</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: تطبيق متجر إلكتروني" 
                    className="rounded-2xl h-12 border-slate-200 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black">التكلفة المتفق عليها (ج.م)</Label>
                  <Input 
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    className="rounded-2xl h-12 border-slate-200 font-black text-lg" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black flex items-center gap-2"><Calendar className="h-4 w-4" /> موعد التسليم</Label>
                  <Input 
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="rounded-2xl h-12 border-slate-200 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black flex items-center gap-2"><ImagePlus className="h-4 w-4" /> رفع صور المشروع (مكتبة صور)</Label>
                  <Input type="file" multiple accept="image/*" onChange={handleFileUpload} className="rounded-2xl h-12 border-slate-200 p-2 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black">متطلبات العميل التفصيلية</Label>
                <Textarea 
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="اكتب هنا كافة تفاصيل المشروع المتفق عليها مع العميل..." 
                  className="rounded-2xl min-h-[120px] border-slate-200 font-bold p-4" 
                />
              </div>

              <div className="space-y-4">
                <Label className="font-black text-slate-800">تخصيص خطوات الإنجاز</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-slate-300" />
                      <span className="text-sm font-bold text-slate-700">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button onClick={handleSaveProject} disabled={isSaving || !selectedClient} className="rounded-2xl font-black h-14 px-12 text-lg shadow-xl w-full md:w-auto">
              {isSaving ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Plus className="ml-2 h-6 w-6" />}
              تأكيد وحفظ المشروع
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-2xl font-black h-14 px-8 text-lg w-full md:w-auto">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
