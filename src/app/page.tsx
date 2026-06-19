"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Users, 
  Briefcase, 
  LayoutDashboard,
  ArrowLeft,
  Settings,
  ShieldCheck
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { profile, loading } = useAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();

  if (loading) return <div className="p-20 text-center font-bold">جاري تحميل النظام...</div>;
  if (!profile) return null;

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const menuItems = [
    { title: "إدارة المشاريع", icon: Briefcase, color: "text-blue-600", path: "/projects", desc: "متابعة تقدم المشاريع والصور" },
    { title: "إدارة المستخدمين", icon: Users, color: "text-emerald-600", path: "/users", desc: "الصلاحيات والأدوار" },
    { title: "حالات الاختبار", icon: ShieldCheck, color: "text-indigo-600", path: "/test-cases", desc: "فحص جودة التطبيقات" },
    { title: "الإعدادات", icon: Settings, color: "text-slate-600", path: "/settings", desc: "ضبط النظام العام" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8" dir="rtl">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline">أهلاً، {profile.name}</h1>
            <p className="text-muted-foreground text-sm">أنت مسجل كـ {profile.role === 'admin' ? 'مدير عام' : 'مختبر'}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-rose-500 font-bold hover:bg-rose-50">
          <LogOut className="ml-2 h-4 w-4" /> خروج
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Card 
            key={item.path} 
            className="hover:shadow-lg transition-all cursor-pointer group border-none shadow-md bg-white"
            onClick={() => router.push(item.path)}
          >
            <CardContent className="p-8 flex items-center gap-6">
              <div className={`p-5 rounded-2xl bg-muted/50 group-hover:scale-110 transition-transform ${item.color}`}>
                <item.icon className="h-10 w-10" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:translate-x-[-5px] transition-transform" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-blue-50 border-none shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-blue-700 font-bold text-sm">
            تم حل مشكلة المسارات وفتح الصلاحيات. نحن الآن نعمل على نسخة الويب المستقرة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}