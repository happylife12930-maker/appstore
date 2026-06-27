
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
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 700; font-size: 13px;">${p.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">${p.status}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: ${dir === 'rtl' ? 'left' : 'right'}; font-weight: 900; font-size: 14px;">${(p.cost || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</td>
      </tr>
    `).join('');

    const logoUrl = agencySettings?.logoUrl || "https://i.ibb.co/v4m0Dyc/logo.png";

    printWindow.document.write(`
      <html dir="${dir}">
        <head>
          <title>${language === 'ar' ? 'كشف مالي' : 'Statement'} - ${client.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Cairo', sans-serif; padding: 0; background: #fff; color: #1e293b; }
            .page-container { width: 210mm; min-height: 297mm; padding: 15mm; margin: auto; }
            
            /* Header */
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-wrap { display: flex; align-items: center; gap: 12px; }
            .logo { height: 60px; width: auto; }
            .brand { font-size: 20px; font-weight: 900; color: #1e293b; }
            .date-ref { text-align: ${dir === 'rtl' ? 'left' : 'right'}; font-size: 11px; color: #64748b; font-weight: 700; }

            /* Title */
            .doc-title { text-align: center; margin-bottom: 25px; }
            .doc-title h1 { font-size: 24px; font-weight: 900; text-decoration: underline; text-underline-offset: 8px; }

            /* Info Grid */
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; }
            .card-label { font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
            .row b { font-weight: 800; color: #111827; }

            /* Table */
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #1e293b; color: #fff; padding: 10px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; font-size: 11px; font-weight: 700; }
            
            /* Footer Summary */
            .summary { background: #1e293b; color: white; padding: 20px; border-radius: 15px; }
            .sum-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
            .sum-total { font-size: 22px; font-weight: 900; color: #fbbf24; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 12px; margin-top: 12px; }

            .legal { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 700; }

            @media print {
              body { background: none; }
              .page-container { margin: 0; padding: 10mm; width: 100%; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header">
              <div class="logo-wrap">
                <img src="${logoUrl}" class="logo" />
                <span class="brand">APP STORE AGENCY</span>
              </div>
              <div class="date-ref">
                <p>#ST-${client.id?.slice(-6).toUpperCase()}</p>
                <p>${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              </div>
            </div>

            <div class="doc-title">
              <h1>${language === 'ar' ? 'كشف حساب مالي معتمد' : 'Certified Financial Statement'}</h1>
            </div>

            <div class="grid">
              <div class="card">
                <div class="card-label">${language === 'ar' ? 'بيانات العميل' : 'Client Details'}</div>
                <div class="row"><span>${language === 'ar' ? 'الاسم:' : 'Name:'}</span> <b>${client.name}</b></div>
                <div class="row"><span>${language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> <b>${client.phone}</b></div>
                <div class="row"><span>${language === 'ar' ? 'الشركة:' : 'Company:'}</span> <b>${client.company || '---'}</b></div>
              </div>
              <div class="card">
                <div class="card-label">${language === 'ar' ? 'جهة الإصدار' : 'Issued By'}</div>
                <div class="row"><b>APP STORE AGENCY</b></div>
                <div class="row"><span>${language === 'ar' ? 'القسم:' : 'Dept:'}</span> <b>${language === 'ar' ? 'المحاسبة والمالية' : 'Accounting'}</b></div>
                <div class="row"><span>${language === 'ar' ? 'البريد:' : 'Email:'}</span> <b>support@appstore.com</b></div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 55%">${language === 'ar' ? 'وصف المشروع / الخدمة' : 'Description'}</th>
                  <th style="width: 20%; text-align: center;">${language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th style="width: 25%; text-align: ${dir === 'rtl' ? 'left' : 'right'}">${language === 'ar' ? 'القيمة' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                ${projectsRows || `<tr><td colspan="3" style="text-align:center; padding: 30px; color: #999;">${language === 'ar' ? 'لا توجد مشاريع' : 'No projects'}</td></tr>`}
              </tbody>
            </table>

            <div class="summary">
              <div class="sum-row">
                <span>${language === 'ar' ? 'إجمالي قيمة التعاقدات:' : 'Total Contracts:'}</span>
                <span>${(client.totalInvoices || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div class="sum-row" style="color: #4ade80;">
                <span>${language === 'ar' ? 'إجمالي المبالغ المحصلة:' : 'Total Collected:'}</span>
                <span>${(client.totalPayments || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div class="sum-row sum-total">
                <span>${language === 'ar' ? 'صافي الرصيد المستحق:' : 'Net Balance Due:'}</span>
                <span>${remainingBalance.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>

            <div class="legal">
              <p>${language === 'ar' ? 'هذا المستند معتمد آلياً ويعد مطالبة مالية رسمية.' : 'This is an auto-generated official financial claim.'}</p>
              <p>© ${new Date().getFullYear()} APP STORE Agency. All Rights Reserved.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
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
