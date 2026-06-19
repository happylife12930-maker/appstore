
"use client";

import * as React from "react";
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  DollarSign, 
  Bug, 
  Clock, 
  ArrowUpRight 
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
  YAxis
} from "recharts";
import { useTranslation } from "@/components/language-provider";

const revenueData = [
  { month: "Jan", revenue: 4500, profit: 2400 },
  { month: "Feb", revenue: 5200, profit: 1398 },
  { month: "Mar", revenue: 4800, profit: 9800 },
  { month: "Apr", revenue: 7800, profit: 3908 },
  { month: "May", revenue: 8900, profit: 4800 },
  { month: "Jun", revenue: 12450, profit: 7800 },
];

const projectProgress = [
  { name: "Zenith CRM", progress: 85 },
  { name: "EcoMobile App", progress: 45 },
  { name: "Fintech Web Port", progress: 65 },
  { name: "HealthTracker", progress: 95 },
];

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: "totalClients", value: "48", icon: Users, trend: "+12%", color: "text-blue-500" },
    { label: "activeProjects", value: "14", icon: Briefcase, trend: "+2", color: "text-amber-500" },
    { label: "finishedProjects", value: "128", icon: CheckCircle2, trend: "+8", color: "text-emerald-500" },
    { label: "openBugs", value: "24", icon: Bug, trend: "-4", color: "text-rose-500" },
    { label: "delayedTasks", value: "7", icon: Clock, trend: "+1", color: "text-orange-500" },
    { label: "monthlyRevenue", value: "$12,450", icon: DollarSign, trend: "+18%", color: "text-indigo-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t(stat.label)}</p>
                <h3 className="text-2xl font-bold font-headline">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t('revenueGrowth')}</CardTitle>
            <CardDescription>{t('overview')}</CardDescription>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t('projectProgress')}</CardTitle>
            <CardDescription>{t('overview')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {projectProgress.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <button className="w-full flex items-center justify-center gap-2 text-sm text-primary font-semibold hover:underline">
                {t('viewAllProjects')} <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
