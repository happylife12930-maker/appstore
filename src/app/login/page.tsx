
"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  // تعيين البيانات التي طلبتها كقيم افتراضية للتسهيل (مع إضافة @appstore.com لأن Firebase يتطلب إيميل)
  const [email, setEmail] = useState("islam_nader@appstore.com");
  const [password, setPassword] = useState("20176885");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let userCredential;
      try {
        // محاولة تسجيل الدخول
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        // إذا لم يكن المستخدم موجوداً، نقوم بإنشائه (للمرة الأولى فقط)
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw loginError;
        }
      }

      const user = userCredential.user;

      // التأكد من وجود سجل للمستخدم في Firestore بصلاحيات مدير
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: "إسلام نادر (المدير العام)",
          email: user.email,
          role: "admin",
          status: "active",
          permissions: [
            "p_dashboard",
            "p_clients",
            "p_projects",
            "p_testers",
            "p_finances"
          ],
          lastLogin: new Date().toLocaleString('ar-EG')
        });
      }

      toast({ title: "تم الدخول بنجاح", description: "مرحباً بك يا مدير النظام" });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "خطأ في الدخول", 
        description: "يرجى التأكد من البيانات أو الاتصال بالدعم.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
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
                <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني (المدير)
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-[10px] text-muted-foreground border-t pt-4">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} APP STORE</p>
        </CardFooter>
      </Card>
    </div>
  );
}
