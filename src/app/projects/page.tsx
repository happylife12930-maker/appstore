"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  Loader2, 
  Trash2, 
  ShieldAlert,
  Home,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { collection, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase"; // Correct import
import { useRouter } from "next/navigation";

/**
 * صفحة إدارة المشاريع الرئيسية الموحدة - تعمل من المسار الرئيسي المباشر
 */
export default function ProjectsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setProjects(projectsData);
      setLoading(false);
    }, (err) => {
      console.error("Firebase Snapshot Error:", err);
      setError(err);
      setLoading(false);
      toast({
        title: "خطأ في الاتصال",
        description: "لا يمكن تحميل بيانات المشاريع. تأكد من اتصالك بالإنترنت.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(true);
    const apiKey = "182b7fc61cf92fcbd3094ed2dce7cd27";
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "ImgBB upload failed");
      }

      const downloadURL = result.data.url;

      const projectData = {
        name: "مشروع جديد " + (projects.length + 1),
        client: "عميل جديد",
        type: "تطبيق ويب / موبايل",
        progress: 10,
        status: "قيد البدء",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects"), projectData);
      toast({ title: "تم الرفع", description: "تمت إضافة المشروع بنجاح." });
    } catch (err: any) {
      console.error("File Upload Error:", err);
      toast({ title: "خطأ في الرفع", description: err.message || "فشل في رفع الملف.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
    } catch (err) {
      console.error("Delete Error:", err);
      toast({ title: "خطأ", description: "فشل في حذف المشروع.", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4" dir="rtl">
        <ShieldAlert className="h-12 w-12 text-rose-500 opacity-50" />
        <h3 className="text-xl font-bold">مشكلة في الوصول للبيانات</h3>
        <p className="text-muted-foreground">حدث خطأ أثناء تحميل المشاريع. تحقق من وحدة التحكم للمزيد من التفاصيل.</p>
        <pre className="text-xs text-left p-2 bg-gray-100 rounded">{error.message}</pre>
        <Button onClick={() => router.push("/")} className="rounded-xl">العودة للرئيسية</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
            <Home className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold">إدارة المشاريع</h2>
            <p className="text-muted-foreground text-sm">مكتبة الأعمال وتقدم التنفيذ.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button asChild disabled={uploading} className="rounded-xl font-bold shadow-lg">
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
              {uploading ? "جاري الرفع..." : "إضافة مشروع"}
            </label>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="overflow-hidden border-none shadow-md group hover:shadow-xl transition-all rounded-3xl bg-white">
              <div className="relative aspect-video bg-muted overflow-hidden">
                {project.imageUrl ? (
                  <Image 
                    src={project.imageUrl} 
                    alt={project.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-10 w-10 mb-2 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className="bg-primary/90 border-none shadow-sm backdrop-blur-sm">{project.status}</Badge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Button variant="destructive" size="icon" className="h-12 w-12 rounded-2xl shadow-xl hover:scale-110 transition-transform" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{project.type} • {project.client}</p>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>نسبة الإنجاز</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!projects || projects.length === 0) && !loading && (
            <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <p className="text-muted-foreground font-medium">لا توجد مشاريع حالياً. ابدأ بإضافة أول مشروع!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
