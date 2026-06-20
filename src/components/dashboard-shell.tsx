
'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  ShieldCheck, 
  Calculator, 
  LifeBuoy, 
  Star, 
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Languages,
  UserCheck,
  ShieldAlert,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// تعريف العناصر مع تحديد من يمكنه رؤيتها
const navItems = [
  { title: "dashboard", url: "/", icon: LayoutDashboard, permission: "p_dashboard", roles: ['admin', 'tester'] },
  { title: "profile", url: "/profile", icon: User, permission: "p_dashboard", roles: ['client', 'admin'] },
  { title: "clients", url: "/clients", icon: Users, permission: "p_clients", roles: ['admin'] },
  { title: "projects", url: "/projects", icon: Briefcase, permission: "p_projects", roles: ['admin', 'tester', 'client'] },
  { title: "testers", url: "/testers", icon: UserCheck, permission: "p_testers", roles: ['admin'] },
  { title: "quotations", url: "/quotations", icon: Calculator, permission: "p_projects", roles: ['admin'] },
  { title: "invoices", url: "/invoices", icon: FileText, permission: "p_finances", roles: ['admin'] },
  { title: "payments", url: "/payments", icon: CreditCard, permission: "p_finances", roles: ['admin'] },
  { title: "support", url: "/support", icon: LifeBuoy, permission: "p_dashboard", roles: ['admin', 'client'] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language, setLanguage, dir } = useTranslation();
  const { profile, loading } = useAuth();

  if (pathname === '/login') return <>{children}</>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // تصفية القائمة بناءً على دور المستخدم وصلاحياته
  const filteredNavItems = navItems.filter(item => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return item.roles.includes(profile.role);
  });

  return (
    <SidebarProvider>
      <Sidebar side={dir === 'rtl' ? 'right' : 'left'} collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/50 py-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-headline font-bold text-xl">
              A
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
              <span className="font-headline font-bold text-lg leading-tight uppercase">APP STORE</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-medium">
                {profile?.role === 'client' ? 'بوابة المستفيد' : t('agencyAdmin')}
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{profile?.role === 'client' ? 'قائمتي' : t('management')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      tooltip={t(item.title)}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{t(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {profile?.role === 'admin' && (
            <SidebarGroup>
              <SidebarGroupLabel>إعدادات النظام</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === "/users"}
                      tooltip="إدارة الصلاحيات"
                    >
                      <Link href="/users">
                        <ShieldAlert className="text-rose-500" />
                        <span>بوابة المستفيدين</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://picsum.photos/seed/${profile?.uid}/100/100`} />
                    <AvatarFallback>{profile?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start transition-all group-data-[collapsible=icon]:hidden overflow-hidden">
                    <span className="font-medium text-sm truncate max-w-[120px]">{profile?.name || 'مستفيد'}</span>
                    <span className="text-xs text-sidebar-foreground/50">
                      {profile?.role === 'client' ? 'عميل نشط' : t(profile?.role || 'admin')}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <h2 className="font-headline text-lg font-bold">
              {profile?.role === 'client' && pathname === '/projects' ? 'متابعة مشاريحي' : t(navItems.find(i => i.url === pathname)?.title || "overview")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full">
              <Languages className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
