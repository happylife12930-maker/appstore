"use client";

import * as React from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Building2, 
  Calendar,
  CreditCard,
  History,
  MessageCircle,
  StickyNote
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";

const clients = [
  {
    id: 1,
    name: "أحمد خليل",
    email: "ahmed@example.com",
    phone: "+20 123 456 7890",
    company: "Techno Nile",
    projects: ["Zenith CRM", "Bakery App"],
    totalBilled: 154000,
    paid: 120000,
    balance: 34000,
    since: "2023-05-12",
    notes: "عميل ذو أولوية عالية، يفضل الواتساب."
  },
  {
    id: 2,
    name: "سارة جونسون",
    email: "sarah.j@global.com",
    phone: "+1 555 987 6543",
    company: "Global Solutions",
    projects: ["Eco-Ecomm"],
    totalBilled: 45000,
    paid: 45000,
    balance: 0,
    since: "2024-01-05",
    notes: "تم الدفع بالكامل، بانتظار عقد الصيانة."
  },
];

export default function ClientsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pr-10" />
        </div>
        <Button className="font-bold">
          <Plus className="ml-2 h-4 w-4" /> إضافة عميل جديد
        </Button>
      </div>

      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">{t('clients')}</TableHead>
                <TableHead className="text-right">{t('company')}</TableHead>
                <TableHead className="text-right">{t('projects')}</TableHead>
                <TableHead className="text-right">البيانات المالية</TableHead>
                <TableHead className="text-right">{t('notes')}</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={`https://picsum.photos/seed/${client.id}/100/100`} />
                        <AvatarFallback>{client.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{client.name}</span>
                        <span className="text-[10px] text-muted-foreground">{client.phone}</span>
                        <span className="text-[10px] text-primary">{client.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-bold">{client.company}</div>
                    <div className="text-[10px] text-muted-foreground italic">{t('since')} {client.since}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.projects.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] flex justify-between">
                        <span>{t('totalBilled')}:</span> <span className="font-bold">{client.totalBilled.toLocaleString()} ج.م</span>
                      </div>
                      <div className="text-[10px] flex justify-between text-emerald-600">
                        <span>{t('paid')}:</span> <span className="font-bold">{client.paid.toLocaleString()} ج.م</span>
                      </div>
                      <div className="text-[10px] flex justify-between text-rose-500 font-bold border-t pt-1">
                        <span>{t('balance')}:</span> <span>{client.balance.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] text-muted-foreground italic w-[150px] truncate">
                      <StickyNote className="inline h-3 w-3 ml-1" /> {client.notes}
                    </p>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start gap-1">
                      <Button variant="ghost" size="icon"><MessageCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><History className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
