
"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email": return "البريد الإلكتروني غير صالح.";
    case "auth/user-not-found": return "لم يتم العثور على حساب بهذا البريد.";
    case "auth/wrong-password": return "كلمة المرور غير صحيحة.";
    case "auth/email-already-in-use": return "البريد مُستخدم بالفعل.";
    default: return "حدث خطأ. يرجى المحاولة مرة أخرى.";
  }
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);

    try {
      // 1. محاولة تسجيل الدخول العادي
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        // 2. إذا فشل، نتحقق مما إذا كان هناك حساب "مجهز" من الأدمن (Invitation)
        const provisionDocRef = doc(db, "users_provision", email);
        const provisionSnap = await getDoc(provisionDocRef);

        if (provisionSnap.exists()) {
          const provisionData = provisionSnap.data();
          // إذا كان الباسورد المكتوب يطابق الباسورد الذي حدده الأدمن، نقوم بإنشاء الحساب رسمياً
          if (password === provisionData.tempPassword) {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // إنشاء بروفايل المستخدم النهائي
            await setDoc(doc(db, "users", user.uid), {
              ...provisionData,
              uid: user.uid,
              lastLogin: new Date().toLocaleString('ar-EG'),
              tempPassword: password // حفظه كما طلب العميل
            });

            // حذف طلب التجهيز
            await deleteDoc(provisionDocRef);
          } else {
            throw { code: 'auth/wrong-password' };
          }
        } else if (email === "islam_nader@appstore.com" && password === "20176885") {
          // حساب الأدمن الافتراضي
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            name: "إسلام نادر (المدير العام)",
            email: email,
            role: "admin",
            status: "active",
            permissions: ["p_all"],
            tempPassword: password
          });
        } else {
          throw loginError;
        }
      }

      if (userCredential) {
        toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في APP STORE" });
        router.push("/");
      }
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      setError(friendlyMessage);
      toast({ title: "فشل الدخول", description: friendlyMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="text-center bg-primary p-10 text-primary-foreground">
          <ShieldCheck className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-3xl font-black">APP STORE</CardTitle>
          <CardDescription className="text-primary-foreground/80 font-bold">بوابة إدارة الوكالة</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-bold">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 pr-2">البريد الإلكتروني</label>
              <Input 
                type="email" 
                placeholder="example@appstore.com" 
                className="rounded-2xl h-14 font-bold border-slate-200" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 pr-2">كلمة المرور</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="rounded-2xl h-14 font-black border-slate-200" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-16 font-black rounded-2xl text-xl mt-6 shadow-xl transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <LogIn className="ml-2 h-6 w-6" />}
              دخول النظام
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
