"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  CreditCard, 
  Search, 
  Printer, 
  Phone, 
  Wallet, 
  Briefcase, 
  Loader2,
  ArrowUpDown,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

// دالة توحيد النص للبحث
const normalizeText = (text: any) => {
  if (!text) return '';
  const str = String(text);
  const arToEn = (s: string) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

function PaymentsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push("/");
      return;
    }
    if (!db) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubProjects();
    };
  }, [profile, router]);

  // دمج البيانات المالية مع العميل والمشاريع
  const financialData = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id || p.clientPhone === client.phone);
      return {
        ...client,
        projectsList: clientProjects,
        projectsCount: clientProjects.length,
        totalRequired: client.totalInvoices || 0,
        totalPaid: client.totalPayments || 0,
        remainingBalance: (client.totalInvoices || 0) - (client.totalPayments || 0)
      };
    });
  }, [clients, projects]);

  // التصفية والبحث
  const filteredData = useMemo(() => {
    let result = financialData;
    
    // فلتر المديونيات
    if (showOnlyUnpaid) {
      result = result.filter(item => item.remainingBalance > 0);
    }

    // فلتر البحث النصي
    const s = normalizeText(searchQuery);
    if (s) {
      result = result.filter(item => 
        normalizeText(item.name).includes(s) || 
        normalizeText(item.phone).includes(s) ||
        item.projectsList.some((p: any) => normalizeText(p.name).includes(s))
      );
    }

    // الترتيب
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [financialData, searchQuery, showOnlyUnpaid, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrintInvoice = (client: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const projectsRows = client.projectsList.map((p: any) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.status}</td>
        <td style="text-align: left;">${(p.cost || 0).toLocaleString('ar-EG')} ج.م</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة - ${client.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #334155; line-height: 1.6; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            .section-title { font-weight: 900; color: #1e293b; border-right: 4px solid #1e293b; padding-right: 10px; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f8fafc; color: #64748b; padding: 12px; text-align: right; font-size: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 700; }
            .totals { margin-top: 30px; background: #f8fafc; padding: 25px; border-radius: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .total-row.grand { font-size: 20px; font-weight: 900; color: #e11d48; margin-top: 15px; border-top: 2px dashed #cbd5e1; pt: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 0; } .invoice-box { border: none; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">APP STORE</div>
              <div style="text-align: left;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">رقم المرجع: #${client.id?.slice(-6).toUpperCase()}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="section-title">بيانات العميل</div>
                <p><b>الاسم:</b> ${client.name}</p>
                <p><b>الهاتف:</b> ${client.phone}</p>
                <p><b>الشركة:</b> ${client.company || '---'}</p>
              </div>
              <div style="text-align: left;">
                <div class="section-title" style="border-right: none; border-left: 4px solid #1e293b; padding-right: 0; padding-left: 10px;">وكالة APP STORE</div>
                <p>القاهرة، جمهورية مصر العربية</p>
                <p>قسم المحاسبة والمالية</p>
                <p>support@appstore.com</p>
              </div>
            </div>

            <div class="section-title">تفاصيل المشاريع والخدمات</div>
            <table>
              <thead>
                <tr>
                  <th>وصف المشروع</th>
                  <th>الحالة</th>
                  <th style="text-align: left;">التكلفة</th>
                </tr>
              </thead>
              <tbody>
                ${projectsRows || '<tr><td colspan="3" style="text-align:center;">لا توجد مشاريع مسجلة</td></tr>'}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>إجمالي قيمة التعاقدات:</span>
                <span>${client.totalRequired.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div class="total-row" style="color: #16a34a;">
                <span>إجمالي المبالغ المسددة:</span>
                <span>${client.totalPaid.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div class="total-row grand">
                <span>الرصيد المتبقي للمطالبة:</span>
                <span>${client.remainingBalance.toLocaleString('ar-EG')} جنيه مصري</span>
              </div>
            </div>

            <div class="footer">
              <p>هذا المستند صادر آلياً من نظام APP STORE للمحاسبة الإلكترونية.</p>
              <p>يرجى تسوية الرصيد المتبقي في أقرب وقت لضمان استمرار الدعم الفني.</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = filteredData.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.phone}</td>
        <td>${item.projectsCount}</td>
        <td>${item.totalRequired.toLocaleString('ar-EG')}</td>
        <td>${item.totalPaid.toLocaleString('ar-EG')}</td>
        <td style="color: ${item.remainingBalance > 0 ? '#e11d48' : '#16a34a'}"><b>${item.remainingBalance.toLocaleString('ar-EG')}</b></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير الموقف المالي الشامل</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 30px; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 30px; border-bottom: 2px solid #eee; pb: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1e293b; color: white; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 12px; }
            .summary { margin-top: 30px; text-align: left; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>تقرير الموقف المالي الشامل - APP STORE</h1>
          <table>
            <thead>
              <tr>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>المشاريع</th>
                <th>إجمالي المطلوب</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="summary">
            إجمالي المستحقات في السوق: ${filteredData.reduce((acc, curr) => acc + curr.remainingBalance, 0).toLocaleString('ar-EG')} ج.م
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل البيانات المالية...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المدفوعات والمالية</h1>
            <p className="text-slate-500 font-bold">متابعة الموقف المالي للعملاء، التحصيل، وإصدار الفواتير</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintAll}
            variant="outline"
            className="rounded-2xl h-14 px-6 font-black gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Printer className="h-5 w-5" /> طباعة تقرير شامل
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="ابحث باسم العميل، رقم الهاتف، أو اسم المشروع المالي..." 
            className="pr-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchQuery("")}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          )}
        </div>
        
        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 h-16 flex items-center gap-3 border whitespace-nowrap">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch 
              id="unpaid-only" 
              checked={showOnlyUnpaid} 
              onCheckedChange={setShowOnlyUnpaid}
              className="data-[state=checked]:bg-rose-500"
            />
            <Label htmlFor="unpaid-only" className="font-black text-slate-600 cursor-pointer text-sm">عرض المديونيات فقط</Label>
          </div>
          {showOnlyUnpaid && (
            <Badge className="bg-rose-500 rounded-lg h-6 font-black">
              {filteredData.length}
            </Badge>
          )}
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="text-right font-black py-6">العميل والمشاريع</TableHead>
                <TableHead className="text-right font-black cursor-pointer" onClick={() => requestSort('totalRequired')}>
                  إجمالي التعاقد <ArrowUpDown className="inline h-3 w-3 mr-1" />
                </TableHead>
                <TableHead className="text-right font-black cursor-pointer" onClick={() => requestSort('totalPaid')}>
                  المسدد <ArrowUpDown className="inline h-3 w-3 mr-1" />
                </TableHead>
                <TableHead className="text-right font-black cursor-pointer" onClick={() => requestSort('remainingBalance')}>
                  المتبقي <ArrowUpDown className="inline h-3 w-3 mr-1" />
                </TableHead>
                <TableHead className="text-center font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                        {item.name?.[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{item.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1" dir="ltr">
                            <Phone className="h-2.5 w-2.5" /> {item.phone}
                          </span>
                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                            <Briefcase className="h-2.5 w-2.5" /> {item.projectsCount} مشاريع
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-600">
                    {item.totalRequired.toLocaleString('ar-EG')} ج.م
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    {item.totalPaid.toLocaleString('ar-EG')} ج.م
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`font-black text-base ${item.remainingBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                        {item.remainingBalance.toLocaleString('ar-EG')} ج.م
                      </span>
                      {item.remainingBalance === 0 ? (
                        <Badge className="bg-green-500 rounded-lg text-[8px] h-4 w-fit mt-1">خالص السداد</Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-200 text-rose-500 rounded-lg text-[8px] h-4 w-fit mt-1">مطالبة معلقة</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      onClick={() => handlePrintInvoice(item)}
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl h-10 px-4 font-black gap-2 hover:bg-primary/5 text-primary"
                    >
                      <FileText className="h-4 w-4" /> فاتورة العميل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center opacity-30">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-black text-lg">لم يتم العثور على أي نتائج مطابقة</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialSummaryCard 
          title="إجمالي السيولة المحصلة" 
          value={filteredData.reduce((acc, curr) => acc + curr.totalPaid, 0)} 
          icon={<CheckCircle2 className="text-green-500" />}
          color="green"
        />
        <FinancialSummaryCard 
          title="إجمالي المستحقات بالخارج" 
          value={filteredData.reduce((acc, curr) => acc + curr.remainingBalance, 0)} 
          icon={<AlertCircle className="text-rose-500" />}
          color="rose"
        />
        <FinancialSummaryCard 
          title="إجمالي قيمة السوق" 
          value={filteredData.reduce((acc, curr) => acc + curr.totalRequired, 0)} 
          icon={<Wallet className="text-primary" />}
          color="primary"
        />
      </div>
    </div>
  );
}

function FinancialSummaryCard({ title, value, icon, color }: any) {
  const colorClasses = {
    green: "bg-green-50 border-green-100 text-green-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    primary: "bg-primary/5 border-primary/10 text-primary"
  };

  return (
    <Card className={`rounded-[2rem] border shadow-sm p-8 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="font-black text-[10px] uppercase tracking-wider opacity-60">{title}</span>
        <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
      </div>
      <div className="text-3xl font-black">{value.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></div>
    </Card>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <PaymentsContent />
    </Suspense>
  );
}