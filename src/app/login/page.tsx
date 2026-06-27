
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Image from "next/image";
import imagesData from "@/app/lib/placeholder-images.json";

const defaultLogo = imagesData.placeholderImages.find(img => img.id === 'agency-logo');

const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email": return "البريد الإلكتروني غير صالح.";
    case "auth/user-not-found": 
    case "auth/invalid-credential": return "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.";
    case "auth/wrong-password": return "كلمة المرور غير صحيحة.";
    case "auth/email-already-in-use": return "البريد مسجل مسبقاً، يرجى الدخول بكلمة مرورك.";
    case "auth/weak-password": return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
    case "auth/user-disabled":
    case "custom/account-disabled": 
      return "عذراً، هذا الحساب معطل حالياً. يرجى مراجعة إدارة الوكالة لإعادة التنشيط.";
    default: return "حدث خطأ في الدخول. تأكد من بياناتك وحاول مرة أخرى.";
  }
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyLogo, setAgencyLogo] = useState(defaultLogo?.imageUrl || "");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    // مراقبة الشعار من قاعدة البيانات
    const unsub = onSnapshot(doc(db, "settings", "agency"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoUrl) {
        setAgencyLogo(docSnap.data().logoUrl);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);

    const emailLower = email.toLowerCase().trim();

    try {
      let userCredential;

      try {
        userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
      } catch (loginError: any) {
        if (loginError.code === "auth/user-not-found" || loginError.code === "auth/invalid-credential") {
          const provisionDocRef = doc(db, "users_provision", emailLower);
          const provisionSnap = await getDoc(provisionDocRef);
          
          if (provisionSnap.exists() && password === provisionSnap.data().tempPassword) {
            userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          } else {
            throw loginError;
          }
        } else {
          throw loginError;
        }
      }

      if (!userCredential) throw new Error("فشل الحصول على بيانات المستخدم");

      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists() && userSnap.data().status === 'inactive') {
        await auth.signOut();
        throw { code: "custom/account-disabled" };
      }

      const provisionDocRef = doc(db, "users_provision", emailLower);
      const provisionSnap = await getDoc(provisionDocRef);

      if (provisionSnap.exists()) {
        const pData = provisionSnap.data();
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
        
        await deleteDoc(provisionDocRef).catch(err => console.warn("Provision Cleanup:", err));
      } else {
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في بوابة المستفيد" });
      router.push("/");
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="text-center bg-white p-10 flex flex-col items-center">
          <div className="relative h-32 w-32 mb-6">
            <Image 
              src={agencyLogo} 
              alt="APP STORE Logo" 
              fill 
              unoptimized
              className="object-contain"
              data-ai-hint="agency logo"
            />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-800">مرحباً بك في APP STORE</CardTitle>
          <CardDescription className="text-slate-400 font-bold">بوابة المستفيد والعملاء</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50 text-rose-600">
                <AlertDescription className="font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
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
              <div className="absolute top-[44px] left-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
              </div>
            </div>
            <Button type="submit" className="w-full h-16 font-black rounded-2xl text-xl mt-6 shadow-xl bg-primary active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <LogIn className="ml-2 h-6 w-6" />}
              دخول البوابة
            </Button>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 leading-relaxed">
              حلول رقمية ... لنمو لا حدود له
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
