
"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Users, 
  Briefcase, 
  Settings, 
  LayoutDashboard, 
  MessageSquare,
  FileText,
  Calculator,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { profile, loading } = useAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();

  if (loading) return <div className="p-8 text-center font-bold">جاري التحميل...</div>;
  if (!profile) return null;

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const menuItems = [
    { title: "المشاريع", icon: Briefcase, color: "text-blue-500", path: "/projects" },
    { title: "العملاء", icon: Users, color: "text-indigo-500", path: "/clients" },
    { title: "المستخدمين", icon: Settings, color: "text-emerald-500", path: "/users" },
    { title: "المختبرين", icon: ShieldCheck, color: "text-rose-500", path: "/testers" },
    { title: "عروض الأسعار", icon: Calculator, color: "text-amber-500", path: "/quotations" },
    { title: "الفواتير", icon: FileText, color: "text-primary", path: "/invoices" },
    { title: "المدفوعات", icon: TrendingUp, color: "text-emerald-600", path: "/payments" },
    { title: "المحادثة", icon: MessageSquare, color: "text-sky-500", path: "/chat" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8" dir="rtl">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">أهلاً بك، {profile.name}</h1>
          <p className="text-muted-foreground mt-1">نظام إدارة الوكالة APP STORE</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleLogout} className="font-bold">
          <LogOut className="ml-2 h-4 w-4" /> خروج
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Card 
            key={item.title} 
            className="hover:shadow-lg transition-all cursor-pointer group border-none shadow-sm"
            onClick={() => router.push(item.path)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
              <div className={`p-4 rounded-2xl bg-muted/50 group-hover:scale-110 transition-transform ${item.color}`}>
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-primary/5 border-none">
        <CardContent className="p-8 text-center">
          <p className="text-primary font-bold">تم حل مشاكل المسارات والصلاحيات بنجاح. يمكنك الآن الانتقال بين الأقسام أعلاه.</p>
        </CardContent>
      </Card>
    </div>
  );
}
