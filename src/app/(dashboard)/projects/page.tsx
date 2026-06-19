"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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
import { collection, query, orderBy, serverTimestamp, deleteDoc, doc, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
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
        name: "مشروع جديد " + ((projects?.length || 0) + 1),
        client: "عميل تجريبي",
        type: "تطبيق ويب",
        progress: 10,
        status: "قيد البدء",
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      };

      addDoc(collection(db, "projects"), projectData).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'projects',
          operation: 'create',
          requestResourceData: projectData
        }));
      });

      toast({ title: "تم الرفع", description: "تمت إضافة المشروع بنجاح." });
    } catch (err: any) {
      toast({ title: "خطأ", description: "فشل في رفع الملف.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db) return;
    const docRef = doc(db, "projects", id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 opacity-50" />
        <h3 className="text-xl font-bold">مشكلة في الوصول للبيانات</h3>
        <p className="text-muted-foreground">تأكد من إعدادات قاعدة البيانات.</p>
        <Button onClick={() => router.push("/")}>العودة للرئيسية</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8" dir="rtl">
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
          <Button asChild disabled={uploading} className="rounded-xl font-bold">
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
          {projects?.map((project: any) => (
            <Card key={project.id} className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all rounded-2xl bg-white">
              <div className="relative aspect-video bg-muted overflow-hidden">
                {project.imageUrl ? (
                  <Image 
                    src={project.imageUrl} 
                    alt={project.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-10 w-10 mb-2 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className="bg-primary/90 border-none shadow-sm">{project.status}</Badge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Button variant="destructive" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{project.type} • {project.client}</p>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
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
          
          {(!projects || projects.length === 0) && (
            <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <p className="text-muted-foreground font-medium">لا توجد مشاريع حالياً. ابدأ بإضافة أول مشروع!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}