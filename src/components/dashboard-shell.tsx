
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
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "overview", url: "/", icon: LayoutDashboard, permission: "p_dashboard", roles: ['admin', 'tester'] },
  { title: "profile", url: "/profile", icon: User, permission: "p_always", roles: ['client', 'admin'] },
  { title: "clients", url: "/clients", icon: Users, permission: "p_clients", roles: ['admin'] },
  { title: "projects", url: "/projects", icon: Briefcase, permission: "p_projects", roles: ['admin', 'tester', 'client'] },
  { title: "testers", url: "/testers", icon: UserCheck, permission: "p_testers", roles: ['admin'] },
  { title: "quotations", url: "/quotations", icon: ImageIcon, permission: "p_projects", roles: ['admin', 'client'] },
  { title: "payments", url: "/payments", icon: CreditCard, permission: "p_finances", roles: ['admin'] },
  { title: "support", url: "/support", icon: LifeBuoy, permission: "p_support", roles: ['admin', 'client'] },
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
      });
      return () => unsub();
    } else if (profile.clientId) {
      const unsub = onSnapshot(doc(db, "support_threads", profile.clientId), (docSnap) => {
        if (docSnap.exists()) setUnreadCount(docSnap.data().unreadClient || 0);
      });
      return () => unsub();
    }
  }, [profile]);

  if (pathname === '/login') return <>{children}</>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const handleLogout = async () => await signOut(auth);

  const filteredNavItems = navItems.filter(item => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (!item.roles.includes(profile.role)) return false;
    if (item.permission === 'p_always') return true;
    if (item.permission === 'p_dashboard' && profile.role !== 'client') return true;
    return profile.permissions.includes(item.permission);
  });

  const NavLinks = ({ className, onItemClick }: { className?: string; onItemClick?: () => void }) => (
    <div className={cn("flex items-center gap-1", className)}>
      {filteredNavItems.map((item) => (
        <Link 
          key={item.url} 
          href={item.url} 
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all",
            pathname === item.url 
              ? "bg-primary text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span className="whitespace-nowrap">{t(item.title)}</span>
          {item.title === 'support' && unreadCount > 0 && (
            <Badge className="bg-rose-500 text-white rounded-full h-4 min-w-4 p-0 flex items-center justify-center text-[8px] border border-white">
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
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all",
            pathname === "/users" ? "bg-rose-500 text-white shadow-md" : "text-rose-400 hover:bg-rose-50"
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="whitespace-nowrap">البوابة</span>
        </Link>
      )}
    </div>
  );

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-background">
      {/* Header with Horizontal Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">A</div>
              <span className="font-black text-sm tracking-tighter uppercase hidden sm:block">APP STORE</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:block overflow-x-auto no-scrollbar">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="rounded-xl h-9 w-9">
              <Languages className="h-4 w-4" />
            </Button>
            
            <Link href="/profile">
              <Avatar className="h-8 w-8 ring-2 ring-slate-100 hover:ring-primary/20 transition-all">
                <AvatarImage src={`https://picsum.photos/seed/${profile?.uid}/100/100`} />
                <AvatarFallback>{profile?.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-rose-500 rounded-xl h-9 w-9">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-xl h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-right text-sm font-black">القائمة الرئيسية</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavLinks className="flex-col items-stretch gap-2" onItemClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
