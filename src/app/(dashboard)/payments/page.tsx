"use client";

import * as React from "react";
import { 
  CreditCard, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";

const payments = [
  { id: "PAY-001", client: "أحمد خليل", amount: 25000, method: "تحويل بنكي", date: "2024-03-10", status: "مدفوع", notes: "دفعة المرحلة الأولى" },
  { id: "PAY-002", client: "سارة جونسون", amount: 15000, method: "بطاقة ائتمان", date: "2024-03-12", status: "جزئي", notes: "دفعة مقدمة" },
  { id: "PAY-003", client: "عمر زايد", amount: 50000, method: "نقداً", date: "2024-03-15", status: "غير مدفوع", notes: "بانتظار التحصيل" },
];

export default function PaymentsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pr-10" />
        </div>
        <Button className="font-bold">
          <Plus className="ml-2 h-4 w-4" /> {t('payments')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase">{t('paid')}</p>
                <h4 className="text-xl font-bold font-headline">124,000 ج.م</h4>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-500 rounded-lg text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase">مدفوع جزئياً</p>
                <h4 className="text-xl font-bold font-headline">42,000 ج.م</h4>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-rose-500 rounded-lg text-white">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase">غير مدفوع</p>
                <h4 className="text-xl font-bold font-headline">85,000 ج.م</h4>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">{t('date')}</TableHead>
                <TableHead className="text-right">{t('clients')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead className="text-right">{t('method')}</TableHead>
                <TableHead className="text-right">{t('status')}</TableHead>
                <TableHead className="text-right">{t('notes')}</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs"><Calendar className="inline h-3 w-3 ml-1" /> {p.date}</TableCell>
                  <TableCell className="font-bold">{p.client}</TableCell>
                  <TableCell className="font-headline font-bold text-primary">{p.amount.toLocaleString()} ج.م</TableCell>
                  <TableCell className="text-xs">{p.method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-none ${
                      p.status === 'مدفوع' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'جزئي' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate">{p.notes}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
