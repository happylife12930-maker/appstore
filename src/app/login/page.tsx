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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Helper function to get a user-friendly error message in Arabic
const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "البريد الإلكتروني غير صالح. يرجى التحقق منه.";
    case "auth/user-not-found":
      return "لم يتم العثور على حساب بهذا البريد الإلكتروني.";
    case "auth/wrong-password":
      return "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.";
    case "auth/email-already-in-use":
      return "هذا البريد الإلكتروني مُستخدم بالفعل في حساب آخر.";
    case "auth/operation-not-allowed":
      return "تسجيل الدخول بالبريد وكلمة المرور غير مُفعّل. يرجى مراجعة مدير النظام.";
    default:
      return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  }
};


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // State to hold the error message
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null); // Reset error on new login attempt

    try {
      let userCredential;
      
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        // Create account for admin if it doesn't exist
        if (email === "islam_nader@appstore.com" && password === "20176885" && loginError.code === 'auth/user-not-found') {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw loginError; // Re-throw other errors
        }
      }

      if (userCredential) {
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          const isAdmin = email === "islam_nader@appstore.com";
          const userData = {
            uid: user.uid,
            name: isAdmin ? "إسلام نادر (المدير العام)" : "مستخدم جديد",
            email: user.email,
            role: isAdmin ? "admin" : "tester",
            status: "active",
            permissions: ["p_dashboard", "p_clients", "p_projects"],
            lastLogin: new Date().toLocaleString('ar-EG')
          };
          
          await setDoc(userDocRef, userData);
        }
        
        toast({ title: "تم الدخول بنجاح", description: "مرحباً بك في APP STORE" });
        router.push("/");
      }
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      setError(friendlyMessage); // Set the friendly error message to state
      toast({ title: "فشل في تسجيل الدخول", description: friendlyMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-primary p-8 text-primary-foreground">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-bold">APP STORE</CardTitle>
          <CardDescription className="text-primary-foreground/80">تسجيل الدخول للنظام</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في المصادقة</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold">البريد الإلكتروني</label>
              <Input 
                type="email" 
                placeholder="example@appstore.com" 
                className="rounded-xl h-12 text-right" 
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
                className="rounded-xl h-12 text-right" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold rounded-xl text-lg mt-4" disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <LogIn className="ml-2 h-5 w-5" />}
              دخول النظام
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
