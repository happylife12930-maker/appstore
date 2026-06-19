
"use client";

import * as React from "react";
import { 
  LifeBuoy, 
  Search, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  User,
  Tag,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/language-provider";

const tickets = [
  { id: "TCK-101", client: "Ahmed Khalil", type: "Bug", priority: "High", sla: "4h remaining", status: "Open" },
  { id: "TCK-102", client: "Sarah Johnson", type: "Feature Request", priority: "Low", sla: "2 days", status: "In Progress" },
  { id: "TCK-103", client: "Omar Zayed", type: "Hosting", priority: "Critical", sla: "Overdue", status: "Resolved" },
];

export default function SupportPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-bold">{t('support')}</h2>
        <Button><Plus className="mr-2 h-4 w-4" /> New Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Badge variant="outline" className={`font-bold ${
                ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                ticket.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {ticket.priority}
              </Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.id}</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> {ticket.client}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {ticket.type}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('sla')}</span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${ticket.sla === 'Overdue' ? 'text-rose-600' : 'text-primary'}`}>
                      <Clock className="h-3 w-3" /> {ticket.sla}
                    </span>
                  </div>
                  <Badge className={`rounded-lg ${
                    ticket.status === 'Resolved' ? 'bg-emerald-500' : 
                    ticket.status === 'In Progress' ? 'bg-amber-500' : 'bg-primary'
                  }`}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="p-8 text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h4 className="font-bold text-muted-foreground">Support Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-2xl font-bold font-headline text-primary">12</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Open Tickets</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-emerald-500">85%</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">SLA Compliance</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-amber-500">1.5h</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Avg. Response</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-primary">48</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
