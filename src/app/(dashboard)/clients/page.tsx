
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
    name: "Ahmed Khalil",
    email: "ahmed@example.com",
    phone: "+20 123 456 7890",
    company: "Techno Nile",
    projects: ["Zenith CRM", "Bakery App"],
    totalBilled: 15400,
    paid: 12000,
    balance: 3400,
    since: "2023-05-12",
    notes: "High priority client, prefers WhatsApp."
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@global.com",
    phone: "+1 555 987 6543",
    company: "Global Solutions",
    projects: ["Eco-Ecomm"],
    totalBilled: 4500,
    paid: 4500,
    balance: 0,
    since: "2024-01-05",
    notes: "Paid in full, waiting for maintenance contract."
  },
];

export default function ClientsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-10" />
        </div>
        <Button className="font-bold">
          <Plus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </div>

      <Card className="shadow-sm border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>{t('clients')}</TableHead>
                <TableHead>{t('company')}</TableHead>
                <TableHead>{t('projects')}</TableHead>
                <TableHead>Financials</TableHead>
                <TableHead>{t('notes')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        <span>{t('totalBilled')}:</span> <span className="font-bold">${client.totalBilled.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] flex justify-between text-emerald-600">
                        <span>{t('paid')}:</span> <span className="font-bold">${client.paid.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] flex justify-between text-rose-500 font-bold border-t pt-1">
                        <span>{t('balance')}:</span> <span>${client.balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] text-muted-foreground italic w-[150px] truncate">
                      <StickyNote className="inline h-3 w-3 mr-1" /> {client.notes}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
