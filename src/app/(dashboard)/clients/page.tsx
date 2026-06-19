
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
  History
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const clients = [
  {
    id: 1,
    name: "Ahmed Khalil",
    email: "ahmed@example.com",
    phone: "+20 123 456 7890",
    company: "Techno Nile",
    projects: 3,
    totalBilled: 15400,
    paid: 12000,
    balance: 3400,
    since: "2023-05-12",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@global.com",
    phone: "+1 555 987 6543",
    company: "Global Solutions",
    projects: 1,
    totalBilled: 4500,
    paid: 4500,
    balance: 0,
    since: "2024-01-05",
  },
  {
    id: 3,
    name: "Omar Zayed",
    email: "omar@startuphub.ae",
    phone: "+971 50 123 4567",
    company: "Startup Hub",
    projects: 5,
    totalBilled: 32000,
    paid: 25000,
    balance: 7000,
    since: "2022-11-20",
  },
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-10" />
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
                <TableHead>Client Details</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Financials</TableHead>
                <TableHead>Balance</TableHead>
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
                        <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{client.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {client.email}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {client.company}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> Since {client.since}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold">
                      {client.projects} Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">${client.totalBilled.toLocaleString()}</span>
                      </div>
                      <div className="text-xs flex justify-between">
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="font-bold text-emerald-600">${client.paid.toLocaleString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-headline font-bold ${client.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      ${client.balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem><History className="mr-2 h-4 w-4" /> View History</DropdownMenuItem>
                        <DropdownMenuItem><CreditCard className="mr-2 h-4 w-4" /> Send Invoice</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Archive Client</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
