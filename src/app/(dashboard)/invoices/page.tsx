
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
  Filter
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

const invoices = [
  {
    id: "INV-2024-001",
    client: "Ahmed Khalil",
    project: "Zenith CRM Mobile",
    amount: 5400,
    discount: 400,
    issued: "2024-02-15",
    due: "2024-03-15",
    status: "Paid",
  },
  {
    id: "INV-2024-002",
    client: "Sarah Johnson",
    project: "Eco-Ecomm Platform",
    amount: 4500,
    discount: 0,
    issued: "2024-02-20",
    due: "2024-03-20",
    status: "Partial",
  },
  {
    id: "INV-2024-003",
    client: "Omar Zayed",
    project: "Health Tracker Pro",
    amount: 8000,
    discount: 1000,
    issued: "2024-03-01",
    due: "2024-04-01",
    status: "Unpaid",
  },
];

export default function InvoicesPage() {
  const { toast } = useToast();

  const handleDownload = (id: string) => {
    toast({
      title: "Generating PDF...",
      description: `Invoice ${id} is being downloaded to your device.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-4 bg-muted rounded-lg">
            <AlertCircle className="h-3 w-3 text-amber-500" /> 2 Overdue Invoices
          </div>
        </div>
        <Button className="font-bold">
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client & Project</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="group">
                  <TableCell className="font-mono font-bold text-primary">
                    {invoice.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{invoice.client}</div>
                    <div className="text-xs text-muted-foreground italic">{invoice.project}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">Issued: {invoice.issued}</div>
                    <div className="text-xs text-rose-500 font-medium">Due: {invoice.due}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-headline font-bold">${invoice.amount.toLocaleString()}</div>
                    {invoice.discount > 0 && (
                      <div className="text-[10px] text-emerald-600">Saved ${invoice.discount}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`font-bold border-none ${
                        invoice.status === "Paid" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : invoice.status === "Partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
