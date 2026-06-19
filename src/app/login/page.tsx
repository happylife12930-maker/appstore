
"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في APP STORE" });
      router.push("/");
    } catch (error: any) {
      toast({ 
        title: "خطأ في الدخول", 
        description: "يرجى التأكد من البريد الإلكتروني وكلمة المرور.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // وظيفة لتهيئة أول حساب مدير للنظام
  const initializeAdmin = async () => {
    setInitLoading(true);
    const adminEmail = "admin@appstore.com";
    const adminPass = "password123";
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      const user = userCredential.user;
      
      // إضافة بيانات المدير في Firestore مع كافة الصلاحيات
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: "مدير النظام الأساسي",
        email: adminEmail,
        role: "admin",
        status: "active",
        lastLogin: new Date().toLocaleString('ar-EG'),
        permissions: [
          "p_dashboard",
          "p_clients",
          "p_projects",
          "p_testers",
          "p_finances"
        ]
      });

      toast({ 
        title: "تم تهيئة النظام", 
        description: "تم إنشاء حساب المدير بنجاح: admin@appstore.com",
      });
      
      setEmail(adminEmail);
      setPassword(adminPass);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: "النظام مهيأ بالفعل", description: "حساب المدير موجود مسبقاً." });
        setEmail(adminEmail);
        setPassword(adminPass);
      } else {
        toast({ title: "خطأ في التهيئة", description: error.message, variant: "destructive" });
      }
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-body">
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
              <label className="text-sm font-bold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> {t('email')}
              </label>
              <Input 
                type="email" 
                placeholder="admin@appstore.com" 
                className="h-11" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" /> كلمة المرور
              </label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-11" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold text-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <LogIn className="ml-2 h-5 w-5" /> دخول النظام
                </>
              )}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground italic">لأول مرة؟</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
            onClick={initializeAdmin}
            disabled={initLoading}
          >
            {initLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}
            تهيئة حساب المدير الأول
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-[10px] text-muted-foreground border-t pt-4">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} APP STORE</p>
          <p className="opacity-50 italic">admin@appstore.com / password123</p>
        </CardFooter>
      </Card>
    </div>
  );
}
