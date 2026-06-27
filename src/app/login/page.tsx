
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff, Languages } from "lucide-react";
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
import { useTranslation } from "@/components/language-provider";

const defaultLogo = imagesData.placeholderImages.find(img => img.id === 'agency-logo');

export default function LoginPage() {
  const { t, language, setLanguage, dir } = useTranslation();
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

      if (!userCredential) throw new Error("Authentication failed");

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
          name: pData.name || "User",
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

      toast({ title: t('login_success'), description: t('login_success_desc') });
      router.push("/");
    } catch (error: any) {
      const msg = error.code === "custom/account-disabled" 
        ? (language === 'ar' ? "عذراً، هذا الحساب معطل حالياً. يرجى مراجعة إدارة الوكالة لإعادة التنشيط." : "Sorry, this account is currently disabled. Please contact management.")
        : (language === 'ar' ? "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور." : "Invalid login credentials. Please check your email and password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans" dir={dir}>
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <div className="absolute top-6 left-6 right-6 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="rounded-full text-slate-400 hover:bg-slate-100 h-10 w-10 p-0">
            <Languages className="h-5 w-5" />
          </Button>
        </div>
        
        <CardHeader className="text-center bg-white p-10 flex flex-col items-center">
          <div className="relative h-28 w-28 mb-6">
            <Image 
              src={agencyLogo} 
              alt="Logo" 
              fill 
              unoptimized
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-800">{t('login_welcome')}</CardTitle>
          <CardDescription className="text-slate-400 font-bold">{t('login_subtitle')}</CardDescription>
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
              <label className={`text-sm font-black text-slate-700 ${dir === 'rtl' ? 'pr-2' : 'pl-2'}`}>{t('email_label')}</label>
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
              <label className={`text-sm font-black text-slate-700 ${dir === 'rtl' ? 'pr-2' : 'pl-2'}`}>{t('password_label')}</label>
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="rounded-2xl h-14 font-black border-slate-200" 
                dir="ltr"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className={`absolute top-[44px] ${dir === 'rtl' ? 'left-4' : 'right-4'} cursor-pointer`} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
              </div>
            </div>
            <Button type="submit" className="w-full h-16 font-black rounded-2xl text-xl mt-6 shadow-xl bg-primary active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <LogIn className="ml-2 h-6 w-6" />}
              {t('login_button')}
            </Button>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 leading-relaxed uppercase tracking-widest">
              {t('login_footer')}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
