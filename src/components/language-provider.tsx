
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
    yearlyRevenue: "Yearly Revenue",
    revenueGrowth: "Revenue Growth",
    projectProgress: "Project Progress",
    viewAllProjects: "View All Projects",
    revenue: "Revenue",
    profit: "Profit",
    month: "Month",
    phone: "Phone",
    email: "Email",
    company: "Company",
    since: "Since",
    totalBilled: "Total Billed",
    paid: "Paid",
    balance: "Balance",
    notes: "Notes",
    status: "Status",
    scenario: "Scenario",
    expectedResult: "Expected Result",
    actualResult: "Actual Result",
    priority: "Priority",
    sla: "SLA",
    type: "Type",
    amount: "Amount",
    method: "Method",
    date: "Date",
    discount: "Discount",
    issued: "Issued",
    due: "Due",
    netProfit: "Net Profit",
    margin: "Profit Margin",
    expenses: "Expenses",
    advertising: "Advertising",
    hosting: "Hosting",
    salaries: "Salaries",
    appDev: "App Development",
    design: "Design",
    testing: "Testing",
    maintenance: "Maintenance",
    satisfaction: "Satisfaction Rate",
    requirements: "Requirements",
    cost: "Cost",
    timeline: "Timeline",
    convertToProject: "Convert to Project",
    ticketId: "Ticket ID",
    bug: "Bug",
    featureRequest: "Feature Request",
    high: "High",
    low: "Low",
    critical: "Critical",
    open: "Open",
    inProgress: "In Progress",
    resolved: "Resolved",
    unpaid: "Unpaid",
    partial: "Partial"
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
    support: "الدعم الفني",
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
    activeProjects: "المشاريع الحالية",
    finishedProjects: "المشاريع المنتهية",
    openBugs: "Bugs مفتوحة",
    delayedTasks: "مهام متأخرة",
    monthlyRevenue: "الإيرادات الشهرية",
    yearlyRevenue: "الإيرادات السنوية",
    revenueGrowth: "نمو الإيرادات",
    projectProgress: "تقدم المشاريع",
    viewAllProjects: "عرض جميع المشاريع",
    revenue: "الإيرادات",
    profit: "الأرباح",
    month: "الشهر",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    company: "الشركة",
    since: "تاريخ البداية",
    totalBilled: "إجمالي الفواتير",
    paid: "إجمالي المدفوعات",
    balance: "الرصيد المتبقي",
    notes: "ملاحظات",
    status: "الحالة",
    scenario: "السيناريو",
    expectedResult: "النتيجة المتوقعة",
    actualResult: "النتيجة الفعلية",
    priority: "الأولوية",
    sla: "SLA",
    type: "النوع",
    amount: "المبلغ",
    method: "طريقة الدفع",
    date: "التاريخ",
    discount: "الخصم",
    issued: "الإصدار",
    due: "الاستحقاق",
    netProfit: "صافي الربح",
    margin: "هامش الربح",
    expenses: "المصروفات",
    advertising: "إعلانات",
    hosting: "استضافات",
    salaries: "رواتب",
    appDev: "تطوير تطبيقات",
    design: "تصميم",
    testing: "اختبارات",
    maintenance: "صيانة",
    satisfaction: "نسبة الرضا",
    requirements: "المتطلبات",
    cost: "التكلفة",
    timeline: "مدة التنفيذ",
    convertToProject: "تحويل إلى مشروع",
    ticketId: "رقم الطلب",
    bug: "مشكلة (Bug)",
    featureRequest: "طلب ميزة",
    high: "مرتفع",
    low: "منخفض",
    critical: "حرج",
    open: "مفتوح",
    inProgress: "قيد التنفيذ",
    resolved: "تم الحل",
    unpaid: "غير مدفوع",
    partial: "مدفوع جزئياً"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');

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
