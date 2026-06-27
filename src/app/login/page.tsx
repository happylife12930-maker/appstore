
"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email": return "البريد الإلكتروني غير صالح.";
    case "auth/user-not-found": 
    case "auth/invalid-credential": return "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.";
    case "auth/wrong-password": return "كلمة المرور غير صحيحة.";
    case "auth/email-already-in-use": return "البريد مسجل مسبقاً، يرجى الدخول بكلمة مرورك.";
    case "auth/weak-password": return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
    default: return "حدث خطأ في الدخول. تأكد من بياناتك وحاول مرة أخرى.";
  }
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);

    const emailLower = email.toLowerCase().trim();

    try {
      let userCredential;

      // 1. محاولة تسجيل الدخول
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
      } catch (loginError: any) {
        // 2. إذا فشل الدخول، نتحقق مما إذا كان حساباً جديداً قيد التفعيل (Provisioning)
        if (loginError.code === "auth/user-not-found" || loginError.code === "auth/invalid-credential") {
          const provisionDocRef = doc(db, "users_provision", emailLower);
          const provisionSnap = await getDoc(provisionDocRef);
          
          if (provisionSnap.exists() && password === provisionSnap.data().tempPassword) {
            // إنشاء الحساب فعلياً في نظام Auth للمستفيد الجديد
            userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          } else {
            // إذا لم يكن قيد التفعيل أو كلمة المرور خطأ، نطرح الخطأ الأصلي ليظهر في الواجهة
            throw loginError;
          }
        } else {
          throw loginError;
        }
      }

      if (!userCredential) throw new Error("فشل الحصول على بيانات المستخدم");

      const user = userCredential.user;

      // --- فحص حالة الحساب (تعطيل الدخول) ---
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists() && userSnap.data().status === 'inactive') {
        await auth.signOut();
        setError("عذراً، هذا الحساب معطل حالياً. يرجى مراجعة إدارة الوكالة لإعادة التنشيط.");
        setLoading(false);
        return;
      }
      // -------------------------------------

      // 3. التحقق من وجود بيانات تفعيل لربط الـ clientId وتجهيز الملف الشخصي
      const provisionDocRef = doc(db, "users_provision", emailLower);
      const provisionSnap = await getDoc(provisionDocRef);

      if (provisionSnap.exists()) {
        const pData = provisionSnap.data();
        // إنشاء مستند المستخدم الدائم بالصلاحيات والبيانات المربوطة
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: pData.name || "مستفيد",
          email: emailLower,
          clientId: pData.clientId || "", 
          role: "client",
          status: "active",
          permissions: pData.permissions || ["p_projects", "p_support"],
          tempPassword: pData.tempPassword || password,
          lastLogin: new Date().toISOString()
        }, { merge: true });
        
        // حذف مستند التفعيل بعد النجاح لضمان عدم تكرار العملية
        await deleteDoc(provisionDocRef).catch(err => console.warn("Provision Cleanup:", err));
      } else {
        // تحديث وقت الدخول للمستخدمين المسجلين مسبقاً
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في بوابة المستفيد" });
      router.push("/");
    } catch (error: any) {
      console.warn("Login Logic Catch:", error.code || error.message);
      setError(getFriendlyErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="text-center bg-primary p-10 text-primary-foreground">
          <ShieldCheck className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-3xl font-black tracking-tight">APP STORE</CardTitle>
          <CardDescription className="text-primary-foreground/80 font-bold">بوابة المستفيد والعملاء</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50 text-rose-600">
                <AlertDescription className="font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 pr-2">البريد الإلكتروني</label>
              <Input 
                type="email" 
                placeholder="example@mail.com" 
                className="rounded-2xl h-14 font-bold border-slate-200" 
                dir="ltr"
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 relative">
              <label className="text-sm font-black text-slate-700 pr-2">كلمة المرور</label>
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="rounded-2xl h-14 font-black border-slate-200" 
                dir="ltr"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute top-1/2 left-3 transform translate-y-1/2 cursor-pointer" onClick={togglePasswordVisibility}>
                {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
              </div>
            </div>
            <Button type="submit" className="w-full h-16 font-black rounded-2xl text-xl mt-6 shadow-xl active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <LogIn className="ml-2 h-6 w-6" />}
              دخول البوابة
            </Button>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 leading-relaxed">
              تأكد من استخدام البريد وكلمة المرور المزودة لك من قبل الإدارة.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
