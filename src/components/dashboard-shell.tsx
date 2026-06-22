'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  LifeBuoy, 
  CreditCard,
  LogOut,
  Languages,
  UserCheck,
  User,
  Loader2,
  Image as ImageIcon,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "overview", url: "/", icon: LayoutDashboard, permission: "p_dashboard", roles: ['admin', 'tester'] },
  { title: "clients", url: "/clients", icon: Users, permission: "p_clients", roles: ['admin'] },
  { title: "projects", url: "/projects", icon: Briefcase, permission: "p_projects", roles: ['admin', 'tester', 'client'] },
  { title: "testers", url: "/testers", icon: UserCheck, permission: "p_testers", roles: ['admin'] },
  { title: "quotations", url: "/quotations", icon: ImageIcon, permission: "p_projects", roles: ['admin', 'client'] },
  { title: "payments", url: "/payments", icon: CreditCard, permission: "p_finances", roles: ['admin'] },
  { title: "support", url: "/support", icon: LifeBuoy, permission: "p_support", roles: ['admin', 'client'] },
  { title: "profile", url: "/profile", icon: User, permission: "p_always", roles: ['client', 'admin', 'tester'] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language, setLanguage, dir } = useTranslation();
  const { profile, loading } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!db || !profile) return;
    if (profile.role === 'admin') {
      const unsub = onSnapshot(collection(db, "support_threads"), (snap) => {
        setUnreadCount(snap.docs.reduce((acc, d) => acc + (d.data().unreadAdmin || 0), 0));
      }, () => {});
      return () => unsub();
    } else if (profile.clientId) {
      const unsub = onSnapshot(doc(db, "support_threads", profile.clientId), (docSnap) => {
        if (docSnap.exists()) setUnreadCount(docSnap.data().unreadClient || 0);
      }, () => {});
      return () => unsub();
    }
  }, [profile]);

  if (pathname === '/login') return <>{children}</>;
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  const handleLogout = async () => await signOut(auth);

  const filteredNavItems = navItems.filter(item => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (!item.roles.includes(profile.role)) return false;
    if (item.permission === 'p_always') return true;
    if (item.permission === 'p_dashboard' && profile.role !== 'client') return true;
    return (profile.permissions || []).includes(item.permission);
  });

  const NavLinks = ({ className, onItemClick }: { className?: string; onItemClick?: () => void }) => (
    <div className={cn("flex items-center gap-1", className)}>
      {filteredNavItems.map((item) => (
        <Link 
          key={item.url} 
          href={item.url} 
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black transition-all duration-300",
            pathname === item.url 
              ? "bg-primary text-white shadow-lg scale-105" 
              : "text-slate-500 hover:bg-slate-100 hover:text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="whitespace-nowrap">{t(item.title)}</span>
          {item.title === 'support' && unreadCount > 0 && (
            <Badge className="bg-rose-500 text-white rounded-full h-4 min-w-[16px] p-0 flex items-center justify-center text-[8px] border-2 border-white">
              {unreadCount}
            </Badge>
          )}
        </Link>
      ))}
      {profile?.role === 'admin' && (
        <Link 
          href="/users" 
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black transition-all",
            pathname === "/users" ? "bg-rose-500 text-white shadow-lg" : "text-rose-400 hover:bg-rose-50"
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="whitespace-nowrap">البوابة</span>
        </Link>
      )}
    </div>
  );

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#f8fafc]">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:rotate-12 transition-transform">AS</div>
              <span className="font-black text-sm tracking-tighter uppercase hidden md:block text-slate-800">APP STORE</span>
            </Link>
            
            <nav className="hidden lg:flex items-center">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="rounded-xl h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5">
              <Languages className="h-5 w-5" />
            </Button>
            
            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <Link href="/profile">
              <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-primary/40 transition-all shadow-md">
                <AvatarImage src={`https://picsum.photos/seed/${profile?.uid}/100/100`} />
                <AvatarFallback className="text-[12px] font-black bg-slate-100">{profile?.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-rose-500 rounded-xl h-10 w-10">
              <LogOut className="h-5 w-5" />
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-xl h-10 w-10 text-slate-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-72 p-0 rounded-l-[2rem]">
                <SheetHeader className="p-6 border-b bg-slate-50">
                  <SheetTitle className={cn("text-lg font-black text-slate-800", dir === 'rtl' ? 'text-right' : 'text-left')}>القائمة الرئيسية</SheetTitle>
                </SheetHeader>
                <div className="p-6">
                  <NavLinks className="flex-col items-stretch gap-3" onItemClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
