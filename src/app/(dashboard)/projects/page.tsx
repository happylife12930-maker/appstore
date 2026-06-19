
"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  ExternalLink, 
  Upload, 
  Loader2, 
  Trash2, 
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { collection, query, orderBy, serverTimestamp, deleteDoc, doc, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";
import { useFirestore, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();
  const [uploading, setUploading] = useState(false);

  const projectsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "projects"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: projects, loading, error } = useCollection(projectsQuery);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const projectData = {
        name: "مشروع جديد " + (projects.length + 1),
        client: "عميل جديد",
        type: "تطبيق أندرويد",
        progress: 10,
        status: "قيد البدء",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects"), projectData).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'projects',
          operation: 'create',
          requestResourceData: projectData
        }));
      });

      toast({ title: "تم الرفع", description: "تمت إضافة المشروع والصورة بنجاح." });
    } catch (err: any) {
      toast({ title: "خطأ", description: "فشل في رفع الملف.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db) return;
    const docRef = doc(db, "projects", id);
    try {
      await deleteDoc(docRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
      toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
    } catch (err: any) {}
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 opacity-50" />
        <h3 className="text-xl font-bold font-headline">خطأ في الصلاحيات</h3>
        <p className="text-muted-foreground">لا تملك صلاحية الوصول لعرض قائمة المشاريع.</p>
        <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

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
          {projects.map((project: any) => (
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
