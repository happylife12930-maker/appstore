
"use client";

import * as React from "react";
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  DollarSign, 
  Bug, 
  Clock, 
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CartesianGrid, 
  XAxis, 
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  YAxis,
  BarChart,
  Bar
} from "recharts";
import { useTranslation } from "@/components/language-provider";

const revenueData = [
  { month: "Jan", revenue: 4500 },
  { month: "Feb", revenue: 5200 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 7800 },
  { month: "May", revenue: 8900 },
  { month: "Jun", revenue: 12450 },
];

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: "activeProjects", value: "14", icon: Briefcase, color: "text-blue-500" },
    { label: "finishedProjects", value: "128", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "monthlyRevenue", value: "$12,450", icon: DollarSign, color: "text-indigo-500" },
    { label: "yearlyRevenue", value: "$142,000", icon: TrendingUp, color: "text-emerald-600" },
    { label: "openBugs", value: "24", icon: Bug, color: "text-rose-500" },
    { label: "delayedTasks", value: "7", icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className={`p-2 rounded-lg bg-muted w-fit ${stat.color} mb-4`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t(stat.label)}</p>
                <h3 className="text-2xl font-bold font-headline">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-xl">{t('revenueGrowth')}</CardTitle>
              <CardDescription>{t('overview')}</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-primary opacity-20" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t('projectProgress')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: "Zenith CRM", prog: 85 },
              { name: "EcoMobile", prog: 45 },
              { name: "Fintech Port", prog: 65 },
              { name: "HealthTracker", prog: 95 }
            ].map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{p.name}</span>
                  <span className="text-primary">{p.prog}%</span>
                </div>
                <Progress value={p.prog} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
