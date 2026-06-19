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
  Activity,
  BarChart3
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
  { month: "يناير", revenue: 45000 },
  { month: "فبراير", revenue: 52000 },
  { month: "مارس", revenue: 48000 },
  { month: "أبريل", revenue: 78000 },
  { month: "مايو", revenue: 89000 },
  { month: "يونيو", revenue: 124500 },
];

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: "totalClients", value: "42", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "activeProjects", value: "14", icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "finishedProjects", value: "128", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "monthlyRevenue", value: "124,500 ج.م", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "yearlyRevenue", value: "1,420,000 ج.م", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "openBugs", value: "24", icon: Bug, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "delayedTasks", value: "7", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const projectsProgress = [
    { name: "Zenith CRM Mobile", progress: 85, color: "bg-primary" },
    { name: "EcoMobile Platform", progress: 45, color: "bg-blue-500" },
    { name: "HealthTracker Pro", progress: 95, color: "bg-emerald-500" },
    { name: "Fintech Port App", progress: 65, color: "bg-orange-500" },
    { name: "Bakery Web Portal", progress: 20, color: "bg-rose-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t(stat.label)}</p>
                <h3 className="text-xl font-bold font-headline">{stat.value}</h3>
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
          <CardContent className="h-[350px]">
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
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#colorRev)" 
                  strokeWidth={3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="font-headline text-xl">{t('projectProgress')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {projectsProgress.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-primary font-mono font-bold">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
