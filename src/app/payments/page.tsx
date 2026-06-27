
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CreditCard, Search, Loader2, ArrowUpDown, FileText, Lock, Printer, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/language-provider";

function PaymentsContent() {
  const { t, dir, language } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [agencySettings, setAgencySettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAdmin = profile?.role === 'admin';
  const hasFinancePermission = isAdmin || (profile?.permissions || []).includes('p_finances');

  useEffect(() => {
    if (!db || authLoading || !profile || !hasFinancePermission) {
      if (!authLoading && !hasFinancePermission) setLoading(false);
      return;
    }

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    onSnapshot(doc(db, "settings", "agency"), (snap) => {
      if (snap.exists()) setAgencySettings(snap.data());
    });

    return () => { unsubClients(); unsubProjects(); };
  }, [profile, authLoading, hasFinancePermission]);

  const handlePrintStatement = (client: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const clientProjects = projects.filter(p => p.clientId === client.id || p.clientPhone === client.phone);
    const remainingBalance = (client.totalInvoices || 0) - (client.totalPayments || 0);

    const projectsRows = clientProjects.map((p: any) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.status}</td>
        <td style="text-align: left;">${(p.cost || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</td>
      </tr>
    `).join('');

    const logoUrl = agencySettings?.logoUrl || "https://i.ibb.co/v4m0Dyc/logo.png";

    printWindow.document.write(`
      <html dir="${dir}">
        <head>
          <title>${language === 'ar' ? 'كشف حساب' : 'Account Statement'} - ${client.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #fff; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 80px; object-fit: contain; }
            .agency-info { text-align: ${dir === 'rtl' ? 'left' : 'right'}; font-size: 12px; color: #64748b; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            .section-title { font-weight: 900; color: #1e293b; border-${dir === 'rtl' ? 'right' : 'left'}: 4px solid #1e293b; padding-${dir === 'rtl' ? 'right' : 'left'}: 10px; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f8fafc; color: #64748b; padding: 12px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; font-size: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 700; }
            .totals { margin-top: 30px; background: #f8fafc; padding: 25px; border-radius: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .total-row.grand { font-size: 20px; font-weight: 900; color: #e11d48; margin-top: 15px; border-top: 2px dashed #cbd5e1; padding-top: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 0; } .invoice-box { border: none; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <img src="${logoUrl}" class="logo" alt="Logo" />
              <div class="agency-info">
                <p style="margin: 0; font-size: 18px; font-weight: 900; color: #1e293b;">APP STORE AGENCY</p>
                <p style="margin: 0;">${language === 'ar' ? 'كشف مالي معتمد' : 'Certified Financial Statement'}</p>
                <p style="margin: 0;">${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="section-title">${language === 'ar' ? 'بيانات العميل' : 'Client Details'}</div>
                <p><b>${language === 'ar' ? 'الاسم' : 'Name'}:</b> ${client.name}</p>
                <p><b>${language === 'ar' ? 'الهاتف' : 'Phone'}:</b> ${client.phone}</p>
                <p><b>${language === 'ar' ? 'الشركة' : 'Company'}:</b> ${client.company || '---'}</p>
              </div>
              <div style="text-align: ${dir === 'rtl' ? 'left' : 'right'};">
                <div class="section-title" style="border: none; border-${dir === 'rtl' ? 'left' : 'right'}: 4px solid #1e293b;">${language === 'ar' ? 'بيانات المصدر' : 'Issuer Details'}</div>
                <p>وكالة APP STORE الرقمية</p>
                <p>القاهرة، جمهورية مصر العربية</p>
                <p>support@appstore.com</p>
              </div>
            </div>

            <div class="section-title">${language === 'ar' ? 'تفاصيل التعاقدات والمشاريع' : 'Contracts & Projects Details'}</div>
            <table>
              <thead>
                <tr>
                  <th>${language === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th>${language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th style="text-align: ${dir === 'rtl' ? 'left' : 'right'};">${language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                </tr>
              </thead>
              <tbody>
                ${projectsRows || `<tr><td colspan="3" style="text-align:center;">${language === 'ar' ? 'لا توجد مشاريع مسجلة' : 'No recorded projects'}</td></tr>`}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>${language === 'ar' ? 'إجمالي قيمة التعاقدات:' : 'Total Contract Value:'}</span>
                <span>${(client.totalInvoices || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div class="total-row" style="color: #16a34a;">
                <span>${language === 'ar' ? 'إجمالي المبالغ المحصلة:' : 'Total Payments Received:'}</span>
                <span>${(client.totalPayments || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div class="total-row grand">
                <span>${language === 'ar' ? 'صافي المتبقي للمطالبة:' : 'Net Remaining Balance:'}</span>
                <span>${remainingBalance.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'جنيه مصري' : 'EGP'}</span>
              </div>
            </div>

            <div class="footer">
              <p>${language === 'ar' ? 'هذا المستند صادر آلياً ولا يحتاج لختم رسمي إلا عند الطلب.' : 'This is an electronically generated document.'}</p>
              <p>APP STORE Agency © ${new Date().getFullYear()}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-xs font-bold text-slate-500">{t('loading')}</p>
    </div>
  );

  if (!hasFinancePermission) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">{t('access_restricted')}</h2>
          <p className="text-slate-500 font-bold text-sm">{t('access_restricted_desc')}</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">{t('back')}</Button>
        </div>
      </div>
    );
  }

  const filteredData = clients.map(client => {
    const remainingBalance = (client.totalInvoices || 0) - (client.totalPayments || 0);
    return { ...client, remainingBalance };
  }).filter(item => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = item.name?.toLowerCase().includes(s) || item.phone?.includes(s);
    const matchesUnpaid = showOnlyUnpaid ? item.remainingBalance > 0 : true;
    return matchesSearch && matchesUnpaid;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" dir={dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><CreditCard className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t('payments')}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('payments_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} />
          <Input 
            placeholder={t('search')} 
            className={`${dir === 'rtl' ? 'pr-12' : 'pl-12'} h-12 rounded-xl font-bold bg-white text-xs border-none shadow-sm`} 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-3 bg-white p-3 px-5 rounded-xl border shadow-sm h-12">
          <Switch id="unpaid" checked={showOnlyUnpaid} onCheckedChange={setShowOnlyUnpaid} />
          <Label htmlFor="unpaid" className="font-black text-[11px] cursor-pointer whitespace-nowrap">
            {language === 'ar' ? 'المديونيات فقط' : 'Unpaid Only'}
          </Label>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black py-4`}>{t('client_name')}</TableHead>
                <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black`}>{t('total_invoices')}</TableHead>
                <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black`}>{t('total_payments')}</TableHead>
                <TableHead className={`${dir === 'rtl' ? 'text-right' : 'text-left'} font-black`}>{t('remaining_balance')}</TableHead>
                <TableHead className="text-center font-black">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold py-4">
                    <div>
                      <p className="text-sm">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold" dir="ltr">{item.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold">{(item.totalInvoices || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'}</TableCell>
                  <TableCell className="text-xs font-bold text-green-600">{(item.totalPayments || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'}</TableCell>
                  <TableCell className={`font-black text-sm ${item.remainingBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    {item.remainingBalance.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintStatement(item)}
                      className="h-9 rounded-xl font-black text-[10px] gap-2 border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-sm"
                    >
                      <Printer className="h-3.5 w-3.5" /> {language === 'ar' ? 'طباعة كشف حساب' : 'Print Statement'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center opacity-30">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-black text-lg">{language === 'ar' ? 'لم يتم العثور على بيانات مالية' : 'No financial data found'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}><PaymentsContent /></Suspense>;
}
