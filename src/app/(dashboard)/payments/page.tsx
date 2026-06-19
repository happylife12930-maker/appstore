
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
  { id: "PAY-001", client: "Ahmed Khalil", amount: 2500, method: "Bank Transfer", date: "2024-03-10", status: "Paid", notes: "First milestone payment" },
  { id: "PAY-002", client: "Sarah Johnson", amount: 1500, method: "Credit Card", date: "2024-03-12", status: "Partial", notes: "Down payment" },
  { id: "PAY-003", client: "Omar Zayed", amount: 5000, method: "Cash", date: "2024-03-15", status: "Unpaid", notes: "Awaiting collection" },
];

export default function PaymentsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-10" />
        </div>
        <Button className="font-bold">
          <Plus className="mr-2 h-4 w-4" /> {t('payments')}
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
                <h4 className="text-2xl font-bold font-headline">$12,400</h4>
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
                <p className="text-xs font-bold text-amber-600 uppercase">Partially Paid</p>
                <h4 className="text-2xl font-bold font-headline">$4,200</h4>
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
                <p className="text-xs font-bold text-rose-600 uppercase">Unpaid</p>
                <h4 className="text-2xl font-bold font-headline">$8,500</h4>
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
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('clients')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('method')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('notes')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs"><Calendar className="inline h-3 w-3 mr-1" /> {p.date}</TableCell>
                  <TableCell className="font-bold">{p.client}</TableCell>
                  <TableCell className="font-headline font-bold text-primary">${p.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{p.method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-none ${
                      p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate">{p.notes}</TableCell>
                  <TableCell className="text-right">
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
