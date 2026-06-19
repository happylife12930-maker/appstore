"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
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
        if (email === "islam_nader@appstore.com" && password === "20176885") {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw loginError;
        }
      }

      if (userCredential) {
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        
        let userDocSnap;
        try {
          userDocSnap = await getDoc(userDocRef);
        } catch (err: any) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get'
          }));
          throw err;
        }
        
        if (!userDocSnap.exists()) {
          const isAdmin = email === "islam_nader@appstore.com";
          const userData = {
            uid: user.uid,
            name: isAdmin ? "إسلام نادر (المدير العام)" : "مستخدم جديد",
            email: user.email,
            role: isAdmin ? "admin" : "tester",
            status: "active",
            permissions: ["p_dashboard", "p_clients", "p_projects", "p_testers", "p_finances"],
            lastLogin: new Date().toLocaleString('ar-EG')
          };
          
          await setDoc(userDocRef, userData).catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: userData
            }));
          });
        }
        
        toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في APP STORE" });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "فشل في تسجيل الدخول. يرجى التأكد من البيانات.";
      toast({ title: "خطأ", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl text-primary-foreground">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold">APP STORE</CardTitle>
          <CardDescription>نظام إدارة الوكالة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">البريد الإلكتروني</label>
              <Input 
                type="email" 
                placeholder="example@appstore.com" 
                className="text-right" 
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
                className="text-right" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <LogIn className="ml-2 h-4 w-4" />}
              دخول النظام
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}