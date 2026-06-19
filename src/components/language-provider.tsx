
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations = {
  en: {
    dashboard: "Dashboard",
    clients: "Clients",
    projects: "Projects",
    quotations: "Quotations",
    invoices: "Invoices",
    payments: "Payments",
    testCases: "Test Cases",
    chat: "Chat",
    support: "Support",
    reviews: "Reviews",
    analytics: "Analytics",
    settings: "Settings",
    logout: "Log Out",
    search: "Search...",
    admin: "Admin",
    agencyAdmin: "Agency Admin",
    overview: "Overview",
    management: "Management",
    totalClients: "Total Clients",
    activeProjects: "Active Projects",
    finishedProjects: "Finished Projects",
    openBugs: "Open Bugs",
    delayedTasks: "Delayed Tasks",
    monthlyRevenue: "Monthly Revenue",
    revenueGrowth: "Revenue Growth",
    projectProgress: "Project Progress",
    viewAllProjects: "View All Projects",
    revenue: "Revenue",
    profit: "Profit",
    month: "Month",
  },
  ar: {
    dashboard: "لوحة التحكم",
    clients: "العملاء",
    projects: "المشاريع",
    quotations: "عروض الأسعار",
    invoices: "الفواتير",
    payments: "المدفوعات",
    testCases: "حالات الاختبار",
    chat: "المحادثة",
    support: "الدعم",
    reviews: "التقييمات",
    analytics: "التحليلات",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    search: "بحث...",
    admin: "مشرف",
    agencyAdmin: "مدير الوكالة",
    overview: "نظرة عامة",
    management: "الإدارة",
    totalClients: "إجمالي العملاء",
    activeProjects: "المشاريع النشطة",
    finishedProjects: "المشاريع المنجزة",
    openBugs: "أخطاء مفتوحة",
    delayedTasks: "مهام متأخرة",
    monthlyRevenue: "الإيرادات الشهرية",
    revenueGrowth: "نمو الإيرادات",
    projectProgress: "تقدم المشاريع",
    viewAllProjects: "عرض جميع المشاريع",
    revenue: "الإيرادات",
    profit: "الربح",
    month: "الشهر",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
