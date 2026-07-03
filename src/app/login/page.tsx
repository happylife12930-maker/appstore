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
        if (loginError.code === "auth/user-not-found" || loginError.code === "auth/invalid-credential" || loginError.code === "auth/invalid-email") {
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
          role: pData.role || "client",
          status: "active",
          permissions: pData.permissions || (pData.role === 'admin' ? ["p_projects", "p_support", "p_finances", "p_clients", "p_testers"] : ["p_projects", "p_support"]),
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
        ? t('account_disabled_msg')
        : (language === 'ar' ? "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور." : "Invalid login credentials. Please check your email and password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans relative" dir={dir}>
      <Card className="w-full max-w-md border-none shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center bg-white p-8 pb-4 flex flex-col items-center border-b border-slate-50 relative">
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-4 w-full justify-center">
              <div className="h-[1px] flex-1 bg-slate-100 max-w-[40px]" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} 
                className="rounded-full border-slate-100 bg-white text-slate-600 hover:bg-slate-50 font-black h-9 px-5 gap-2 shadow-sm transition-all active:scale-95 border-2 group"
              >
                <Languages className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] tracking-tight">{language === 'en' ? 'العربية' : 'English'}</span>
              </Button>
              <div className="h-[1px] flex-1 bg-slate-100 max-w-[40px]" />
            </div>

            <div className="relative h-44 w-44 transition-transform hover:scale-105 duration-500 drop-shadow-sm">
              <Image 
                src={agencyLogo} 
                alt="Logo" 
                fill 
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <CardTitle className="text-xl font-black tracking-tight text-slate-800">{t('login_welcome')}</CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs mt-0.5">{t('login_subtitle')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50 text-rose-600 shadow-sm p-3">
                <AlertDescription className="font-bold flex items-center gap-2 text-[10px]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <label className={`text-[9px] font-black text-slate-500 uppercase tracking-widest ${dir === 'rtl' ? 'pr-3' : 'pl-3'}`}>{t('email_label')}</label>
              <Input 
                type="email" 
                placeholder="example@mail.com" 
                className="rounded-xl h-12 font-bold border-slate-100 bg-slate-50 focus-visible:ring-primary/20 focus-visible:bg-white transition-all px-5 text-sm" 
                dir="ltr"
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 relative">
              <label className={`text-[9px] font-black text-slate-500 uppercase tracking-widest ${dir === 'rtl' ? 'pr-3' : 'pl-3'}`}>{t('password_label')}</label>
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="rounded-xl h-12 font-black border-slate-100 bg-slate-50 focus-visible:ring-primary/20 focus-visible:bg-white transition-all px-5 text-sm" 
                dir="ltr"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className={`absolute top-[34px] ${dir === 'rtl' ? 'left-3' : 'right-3'} cursor-pointer h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-200/50 transition-colors`} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
            <Button type="submit" className="w-full h-14 font-black rounded-xl text-lg mt-2 shadow-lg bg-primary active:scale-95 transition-all hover:shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <LogIn className="ml-2 h-5 w-5" />}
              {t('login_button')}
            </Button>
            <div className="pt-2">
              <p className="text-center text-[8px] font-black text-slate-300 leading-relaxed uppercase tracking-[0.2em]">
                {t('login_footer')}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
