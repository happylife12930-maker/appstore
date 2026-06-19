
"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";

export default function LoginPage() {
  const { t } = useTranslation();
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
        if (
          (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') &&
          email === "islam_nader@appstore.com" && 
          password === "20176885"
        ) {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw loginError;
        }
      }

      if (userCredential) {
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            const userData = {
              uid: user.uid,
              name: email === "islam_nader@appstore.com" ? "إسلام نادر (المدير العام)" : "مستخدم جديد",
              email: user.email,
              role: "admin",
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
        } catch (err: any) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get'
          }));
        }
      }
    } catch (error: any) {
      let message = "يرجى التأكد من البريد الإلكتروني وكلمة المرور.";
      if (error.code === 'auth/configuration-not-found') {
        message = "يجب تفعيل 'Email/Password' في لوحة تحكم Firebase Console.";
      }
      toast({ 
        title: "خطأ في الدخول", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-body text-right" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold uppercase tracking-tight">APP STORE</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            سجل دخولك لإدارة وكالتك البرمجية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 justify-end">
                البريد الإلكتروني <Mail className="h-4 w-4 text-primary" />
              </label>
              <Input 
                type="email" 
                placeholder="example@appstore.com" 
                className="h-11 text-right" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 justify-end">
                كلمة المرور <Lock className="h-4 w-4 text-primary" />
              </label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-11 text-right" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold text-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  دخول النظام <LogIn className="mr-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-[10px] text-muted-foreground border-t pt-4">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} APP STORE</p>
        </CardFooter>
      </Card>
    </div>
  );
}
