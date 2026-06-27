
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
    // Nav & General
    dashboard: "Dashboard",
    overview: "Overview",
    clients: "Clients",
    projects: "Projects",
    installments: "Installments",
    quotations: "Quotations",
    payments: "Payments",
    testers: "Testers",
    support: "Support",
    profile: "Profile",
    users: "Portal",
    logout: "Log Out",
    search: "Search...",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",

    // Login Page
    login_welcome: "Welcome to APP STORE",
    login_subtitle: "Beneficiary and Client Portal",
    email_label: "Email Address",
    password_label: "Password",
    login_button: "Enter Portal",
    login_footer: "Digital Solutions... for Unlimited Growth",
    login_success: "Login Successful",
    login_success_desc: "Welcome to the portal",

    // Dashboard
    dashboard_title: "Dashboard",
    welcome_back: "Welcome back",
    follow_updates: "Follow the latest developments",
    admin_center: "Integrated Management Center",
    client_center: "Transparent Vision for your Project",
    admin_desc: "Welcome to the core engine of APP STORE agency; where digital solutions meet unlimited growth. Control every aspect of the agency from one place.",
    client_desc: "Dear partner, we are here to turn your ideas into a tangible digital reality. Follow the stages of implementing your requests moment by moment to ensure the best results.",
    start_work: "Start Work Today",
    request_support: "Request Support",
    
    // Stats
    total_clients: "Total Clients",
    active_projects: "Active Projects",
    finished_projects: "Finished Projects",
    support_inbox: "Support Inbox",
    unread_messages: "unread",
    none: "None",
    manage: "Manage",
    status_active: "Active",
    status_pending: "Pending",
    status_completed: "Completed",

    // Errors
    access_restricted: "Access Restricted",
    access_restricted_desc: "You don't have permission to view this section currently. Please check with management."
  },
  ar: {
    // القائمة والعام
    dashboard: "لوحة التحكم",
    overview: "نظرة عامة",
    clients: "العملاء",
    projects: "المشاريع",
    installments: "الأقساط",
    quotations: "عروض الأسعار",
    payments: "المدفوعات",
    testers: "المختبرين",
    support: "الدعم الفني",
    profile: "حسابي",
    users: "البوابة",
    logout: "خروج",
    search: "بحث...",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",

    // صفحة الدخول
    login_welcome: "مرحباً بك في APP STORE",
    login_subtitle: "بوابة المستفيد والعملاء",
    email_label: "البريد الإلكتروني",
    password_label: "كلمة المرور",
    login_button: "دخول البوابة",
    login_footer: "حلول رقمية ... لنمو لا حدود له",
    login_success: "تم الدخول بنجاح",
    login_success_desc: "مرحباً بك في بوابة المستفيد",

    // لوحة التحكم
    dashboard_title: "لوحة التحكم",
    welcome_back: "مرحباً",
    follow_updates: "تابع آخر التطورات",
    admin_center: "مركز الإدارة المتكامل",
    client_center: "رؤية شفافة لمشروعك",
    admin_desc: "أهلاً بك في المحرك الرئيسي لوكالة APP STORE؛ حيث تلتقي الحلول الرقمية مع النمو الذي لا حدود له. تحكم في كافة جوانب الوكالة من مكان واحد.",
    client_desc: "شريكنا العزيز، نحن هنا لنحول أفكارك إلى واقع رقمي ملموس. تابع مراحل تنفيذ طلباتك لحظة بلحظة لضمان الحصول على أفضل النتائج.",
    start_work: "ابدأ العمل اليوم",
    request_support: "اطلب دعم فني",

    // الإحصائيات
    total_clients: "إجمالي العملاء",
    active_projects: "مشاريع نشطة",
    finished_projects: "مشاريع منتهية",
    support_inbox: "رسائل الدعم",
    unread_messages: "غير مقروءة",
    none: "لا توجد",
    manage: "إدارة",
    status_active: "نشط",
    status_pending: "معلق",
    status_completed: "مكتمل",

    // الأخطاء
    access_restricted: "عذراً، الصلاحية مقيدة",
    access_restricted_desc: "لم يتم منحك صلاحية الوصول لهذا القسم حالياً. يرجى مراجعة الإدارة."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
