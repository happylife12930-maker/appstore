"use client";

import * as React from "react";
import { 
  FileText, 
  Download, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Send,
  AlertCircle,
  Filter,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";

const invoices = [
  {
    id: "INV-2024-001",
    client: "أحمد خليل",
    project: "Zenith CRM Mobile",
    amount: 54000,
    discount: 4000,
    issued: "2024-02-15",
    due: "2024-03-15",
    status: "مدفوع",
  },
  {
    id: "INV-2024-002",
    client: "سارة جونسون",
    project: "Eco-Ecomm Platform",
    amount: 45000,
    discount: 0,
    issued: "2024-02-20",
    due: "2024-03-20",
    status: "جزئي",
  },
  {
    id: "INV-2024-003",
    client: "عمر زايد",
    project: "Health Tracker Pro",
    amount: 80000,
    discount: 10000,
    issued: "2024-03-01",
    due: "2024-04-01",
    status: "غير مدفوع",
  },
];

export default function InvoicesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDownload = (id: string) => {
    toast({
      title: "جاري إنشاء PDF...",
      description: `تم إنشاء وتحميل الفاتورة ${id} للمشروع بنجاح.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="h-4 w-4 ml-2" /> تصفية</Button>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-4 bg-muted rounded-lg">
            <AlertCircle className="h-3 w-3 text-amber-500" /> فاتورتان متأخرتان
          </div>
        </div>
        <Button className="font-bold">
          <Plus className="ml-2 h-4 w-4" /> {t('invoices')}
        </Button>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">{t('clients')}</TableHead>
                <TableHead className="text-right">{t('projects')}</TableHead>
                <TableHead className="text-right">{t('issued')} / {t('due')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead className="text-right">{t('status')}</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="group">
                  <TableCell className="font-mono font-bold text-primary">
                    {invoice.id}
                  </TableCell>
                  <TableCell className="font-bold">
                    {invoice.client}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium bg-primary/5 text-primary border-none">
                      <Briefcase className="h-3 w-3 ml-1" /> {invoice.project}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">{invoice.issued}</div>
                    <div className="text-xs text-rose-500 font-bold">{invoice.due}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-headline font-bold text-lg">{invoice.amount.toLocaleString()} ج.م</div>
                    {invoice.discount > 0 && (
                      <div className="text-[10px] text-emerald-600 font-bold">-{t('discount')}: {invoice.discount.toLocaleString()} ج.م</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`font-bold border-none ${
                        invoice.status === "مدفوع" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : invoice.status === "جزئي"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
