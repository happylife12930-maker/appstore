"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    try {
      let userCredential;
      
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        // إذا كان المستخدم هو المدير ولم يكن مسجلاً، نقوم بإنشائه تلقائياً
        if (email === "islam_nader@appstore.com" && password === "20176885") {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw loginError;
        }
      }

      if (userCredential) {
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          const isAdmin = email === "islam_nader@appstore.com";
          const userData = {
            uid: user.uid,
            name: isAdmin ? "إسلام نادر (المدير العام)" : "مستخدم جديد",
            email: user.email,
            role: isAdmin ? "admin" : "tester",
            status: "active",
            permissions: ["p_dashboard", "p_clients", "p_projects"],
            lastLogin: new Date().toLocaleString('ar-EG')
          };
          
          await setDoc(userDocRef, userData);
        }
        
        toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في APP STORE" });
        router.push("/");
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل في تسجيل الدخول. تأكد من البيانات.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-primary p-8 text-primary-foreground">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">APP STORE</CardTitle>
          <CardDescription className="text-primary-foreground/80">تسجيل الدخول للنظام</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">البريد الإلكتروني</label>
              <Input 
                type="email" 
                placeholder="example@appstore.com" 
                className="rounded-xl h-12" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">كلمة المرور</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="rounded-xl h-12" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold rounded-xl text-lg mt-4" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <LogIn className="ml-2 h-5 w-5" />}
              دخول النظام
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}