
"use client";

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
  Languages
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

const navItems = [
  { title: "dashboard", url: "/", icon: LayoutDashboard },
  { title: "clients", url: "/clients", icon: Users },
  { title: "projects", url: "/projects", icon: Briefcase },
  { title: "quotations", url: "/quotations", icon: Calculator },
  { title: "invoices", url: "/invoices", icon: FileText },
  { title: "payments", url: "/payments", icon: CreditCard },
  { title: "testCases", url: "/test-cases", icon: ShieldCheck },
  { title: "chat", url: "/chat", icon: MessageSquare },
  { title: "support", url: "/support", icon: LifeBuoy },
  { title: "reviews", url: "/reviews", icon: Star },
  { title: "analytics", url: "/analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language, setLanguage, dir } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <SidebarProvider>
      <Sidebar side={dir === 'rtl' ? 'right' : 'left'} collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/50 py-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-headline font-bold text-xl">
              Z
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
              <span className="font-headline font-bold text-lg leading-tight">Zenith</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-medium">{t('agencyAdmin')}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('management')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
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
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/seed/user1/100/100" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start transition-all group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="font-medium text-sm">John Doe</span>
                  <span className="text-xs text-sidebar-foreground/50">{t('admin')}</span>
                </div>
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
              {t(navItems.find(i => i.url === pathname)?.title || "overview")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full">
              <Languages className="h-5 w-5" />
            </Button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
              <Settings className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-destructive transition-colors p-2">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
