
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  MoreVertical,
  LayoutGrid,
  List,
  Upload,
  Loader2,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // استماع لحظي للمشاريع من Firestore
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. رفع الصورة إلى Firebase Storage
      const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. إضافة بيانات المشروع إلى Firestore
      await addDoc(collection(db, "projects"), {
        name: "مشروع جديد " + (projects.length + 1),
        client: "عميل جديد",
        type: "تطبيق أندرويد",
        progress: 10,
        status: "قيد البدء",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      toast({ title: "تم الرفع", description: "تمت إضافة المشروع والصورة بنجاح." });
    } catch (error) {
      console.error(error);
      toast({ title: "خطأ", description: "فشل في رفع الصورة.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في الحذف.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold">مكتبة المشاريع</h2>
          <p className="text-muted-foreground text-sm">إدارة دورة حياة المشروع وأصوله الحقيقية.</p>
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
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
              {uploading ? "جاري الرفع..." : "مشروع وصورة جديدة"}
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
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-none shadow-sm group hover:shadow-md transition-all">
              <div className="relative aspect-video bg-muted overflow-hidden">
                {project.imageUrl ? (
                  <Image 
                    src={project.imageUrl} 
                    alt={project.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <ImagePlus className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-xs">لا توجد صور لهذا المشروع.</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur">
                    <ExternalLink className="h-4 w-4 ml-2" /> عرض المعرض
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Badge 
                  className={`absolute top-3 right-3 border-none ${
                    project.status === "Completed" || project.progress === 100 ? "bg-emerald-500" : "bg-primary"
                  }`}
                >
                  {project.status}
                </Badge>
              </div>
              
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg font-headline">{project.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{project.type} لـ {project.client}</p>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">نسبة الإنجاز</span>
                    <span className="text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">لا توجد مشاريع حالياً. ابدأ برفع أول صورة لمشروعك!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
