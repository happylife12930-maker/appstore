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
    edit: "Edit",
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    none: "None",
    manage: "Manage",
    actions: "Actions",

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
    status_active: "Active",
    status_pending: "Pending",
    status_completed: "Completed",
    status_in_progress: "In Progress",

    // Projects Page
    projects_title: "Projects Management",
    projects_subtitle: "Follow implementation stages and requirements",
    my_projects: "My Projects",
    add_project: "Add New Project",
    project_name: "Project Name",
    client_name: "Client",
    progress: "Total Progress",
    view_details: "View Implementation Details",
    no_projects: "No projects in this section currently",
    search_projects: "Search by project or client name...",
    all_projects: "All",

    // Clients Page
    clients_title: "Clients Management",
    clients_subtitle: "View and edit client data",
    add_client: "Add New Client",
    search_clients: "Search by name, company, or phone...",
    phone_numbers: "Contact Numbers",
    primary_phone: "Primary",
    extra_phone: "Extra",
    company: "Company",
    remaining_balance: "Remaining Balance",

    // Installments Page
    installments_title: "Installments Scheduling",
    installments_subtitle: "Manage scheduled contract amounts and collection",
    total_installments: "Total Installments",
    collected: "Collected",
    pending_amounts: "Pending Amounts",
    overdue_installments: "Overdue",
    whatsapp_reminders: "WhatsApp Payment Reminder",
    print_report: "Print Report",
    search_installments: "Search by project or client...",
    from_date: "From Date",
    to_date: "To Date",
    collection_ratio: "Collection Rate",
    due_date: "Due Date",
    paid: "Paid",

    // Support Page
    support_center: "Support Center",
    support_subtitle: "Direct communication with clients",
    active_threads: "Active",
    archived_threads: "Archived",
    search_support: "Search by name or phone...",
    no_messages: "No messages yet. Start a conversation!",
    type_message: "Write your message...",
    delete_chat: "Delete Conversation?",
    delete_chat_desc: "This will permanently remove the chat history.",
    online_now: "Online Now",

    // Portal / Users
    portal_title: "Portal & Permissions",
    portal_subtitle: "Manage logins, passwords, and account status",
    activate_clients: "Activate New Clients",
    active_accounts: "Active Accounts",
    pending_activation: "Awaiting First Login",
    temp_password: "Temporary Password",
    current_password: "Current Password",
    user_settings: "User Settings",
    account_status: "Account Status",
    available_permissions: "Available Permissions",
    view_projects_perm: "View Projects",
    support_perm: "Technical Support",
    finances_perm: "Financial Data",

    // Errors
    access_restricted: "Access Restricted",
    access_restricted_desc: "You don't have permission to view this section currently. Please check with management.",
    account_disabled_msg: "Sorry, this account is currently disabled. Please contact management."
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
    edit: "تعديل",
    add: "إضافة",
    close: "إغلاق",
    confirm: "تأكيد",
    back: "عودة",
    none: "لا توجد",
    manage: "إدارة",
    actions: "الإجراءات",

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
    status_active: "نشط",
    status_pending: "معلق",
    status_completed: "مكتمل",
    status_in_progress: "قيد التنفيذ",

    // صفحة المشاريع
    projects_title: "إدارة المشاريع",
    projects_subtitle: "متابعة مراحل التنفيذ والمتطلبات",
    my_projects: "مشاريعي",
    add_project: "إضافة مشروع جديد",
    project_name: "اسم المشروع",
    client_name: "العميل",
    progress: "إجمالي الإنجاز",
    view_details: "عرض تفاصيل التنفيذ",
    no_projects: "لا توجد مشاريع في هذا القسم حالياً",
    search_projects: "بحث باسم المشروع أو العميل...",
    all_projects: "الكل",

    // صفحة العملاء
    clients_title: "إدارة العملاء",
    clients_subtitle: "عرض وتعديل بيانات العملاء",
    add_client: "إضافة عميل جديد",
    search_clients: "ابحث بالاسم، الشركة، أو الهاتف...",
    phone_numbers: "أرقام التواصل",
    primary_phone: "أساسي",
    extra_phone: "إضافي",
    company: "الشركة",
    remaining_balance: "الرصيد المتبقي",

    // صفحة الأقساط
    installments_title: "جدولة ومتابعة الأقساط",
    installments_subtitle: "إدارة مبالغ التعاقد المجدولة والتحصيل بكل مشروع",
    total_installments: "إجمالي الأقساط",
    collected: "تم تحصيله",
    pending_amounts: "مبالغ معلقة",
    overdue_installments: "أقساط متأخرة",
    whatsapp_reminders: "تذكيرات واتساب للسداد",
    print_report: "طباعة التقرير",
    search_installments: "ابحث باسم المشروع أو العميل...",
    from_date: "من تاريخ",
    to_date: "إلى تاريخ",
    collection_ratio: "نسبة التحصيل",
    due_date: "تاريخ الاستحقاق",
    paid: "مدفوع",

    // صفحة الدعم
    support_center: "مركز المراسلات",
    support_subtitle: "تواصل مباشر مع العملاء",
    active_threads: "نشطة",
    archived_threads: "الأرشيف",
    search_support: "ابحث بالاسم أو الهاتف...",
    no_messages: "لا توجد رسائل سابقة. ابدأ المحادثة الآن!",
    type_message: "اكتب رسالتك...",
    delete_chat: "حذف المحادثة؟",
    delete_chat_desc: "سيتم مسح سجل المحادثة تماماً من النظام.",
    online_now: "متصل الآن",

    // بوابة المستخدمين
    portal_title: "بوابة المستفيدين والصلاحيات",
    portal_subtitle: "إدارة الدخول، كلمات المرور، وحالة الحسابات",
    activate_clients: "تفعيل عملاء جدد",
    active_accounts: "الحسابات المسجلة والنشطة",
    pending_activation: "حسابات قيد التفعيل",
    temp_password: "كلمة المرور المؤقتة",
    current_password: "كلمة المرور الحالية",
    user_settings: "إعدادات حساب المستخدم",
    account_status: "حالة الحساب",
    available_permissions: "صلاحيات المستفيد",
    view_projects_perm: "عرض المشاريع",
    support_perm: "الدعم الفني",
    finances_perm: "البيانات المالية",

    // الأخطاء
    access_restricted: "عذراً، الصلاحية مقيدة",
    access_restricted_desc: "لم يتم منحك صلاحية الوصول لهذا القسم حالياً. يرجى مراجعة الإدارة.",
    account_disabled_msg: "عذراً، هذا الحساب معطل حالياً. يرجى مراجعة إدارة الوكالة لإعادة التنشيط."
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
