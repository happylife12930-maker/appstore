
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
    case "auth/user-not-found": return "لم يتم العثور على حساب. إذا كنت عميلاً جديداً، استخدم كلمة المرور المسلمة لك.";
    case "auth/wrong-password": return "كلمة المرور غير صحيحة.";
    case "auth/email-already-in-use": return "هذا البريد مسجل بالفعل، يرجى تسجيل الدخول مباشرة.";
    default: return "حدث خطأ في الدخول. تأكد من بياناتك وحاول مرة أخرى.";
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
      // 1. فحص وجود بيانات تجهيز (تفعيل)
      const provisionDocRef = doc(db, "users_provision", email);
      const provisionSnap = await getDoc(provisionDocRef);
      const provisionData = provisionSnap.exists() ? provisionSnap.data() : null;

      try {
        // 2. محاولة تسجيل الدخول العادي أولاً
        const loginRes = await signInWithEmailAndPassword(auth, email, password);
        const user = loginRes.user;

        // إذا كان هناك بيانات تجهيز، نقوم بتحديث ملف المستخدم فوراً (لضمان وجود الـ clientId)
        if (provisionData && user) {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: provisionData.name || "مستفيد",
            email: email,
            phone: provisionData.phone || "",
            clientId: provisionData.clientId || "", // هذا هو المعرف (id) من جدول العملاء
            role: "client",
            status: "active",
            permissions: ["p_projects"],
            lastLogin: new Date().toLocaleString('ar-EG')
          }, { merge: true });
          
          await deleteDoc(provisionDocRef);
        }

        toast({ title: "تم الدخول بنجاح", description: "مرحباً بك مجدداً في APP STORE" });
        router.push("/");
        return;
      } catch (loginError: any) {
        // 3. إذا فشل الدخول لأن الحساب غير موجود في Auth
        if (loginError.code === "auth/user-not-found" && provisionData && password === provisionData.tempPassword) {
          const createRes = await createUserWithEmailAndPassword(auth, email, password);
          const user = createRes.user;

          if (user) {
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              name: provisionData.name || "مستفيد",
              email: email,
              phone: provisionData.phone || "",
              clientId: provisionData.clientId || "", 
              role: "client",
              status: "active",
              permissions: ["p_projects"],
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toLocaleString('ar-EG')
            });

            await deleteDoc(provisionDocRef);
            
            toast({ title: "تم تفعيل حسابك", description: "تم ربط بياناتك بنجاح، يمكنك الآن متابعة مشاريعك." });
            router.push("/");
            return;
          }
        } else {
          // إذا كان الخطأ كلمة مرور خطأ أو بريد مستخدم (أو أي خطأ آخر)
          throw loginError;
        }
      }
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      setError(friendlyMessage);
      toast({ title: "فشل العملية", description: friendlyMessage, variant: "destructive" });
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
          <CardDescription className="text-primary-foreground/80 font-bold">بوابة المستفيد والعملاء</CardDescription>
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
              <label className="text-sm font-black text-slate-700 pr-2">البريد الإلكتروني للعميل</label>
              <Input 
                type="email" 
                placeholder="example@mail.com" 
                className="rounded-2xl h-14 font-bold border-slate-200 text-right" 
                dir="ltr"
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
                className="rounded-2xl h-14 font-black border-slate-200 text-right" 
                dir="ltr"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-16 font-black rounded-2xl text-xl mt-6 shadow-xl transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <LogIn className="ml-2 h-6 w-6" />}
              دخول البوابة
            </Button>
            <p className="text-center text-xs font-bold text-slate-400 mt-4 leading-relaxed px-4">
              إذا كنت تدخل لأول مرة، يرجى استخدام كلمة المرور التي زودتك بها إدارة الوكالة لتفعيل حسابك.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
