"use client";

import * as React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

const pnlData = [
  { name: "تطوير تطبيقات", revenue: 450000, expense: 120000 },
  { name: "تصميم UI", revenue: 150000, expense: 50000 },
  { name: "اختبارات", revenue: 80000, expense: 20000 },
  { name: "صيانة", revenue: 120000, expense: 40000 },
];

const expenseBreakdown = [
  { name: "استضافة", value: 45000, color: "#364E7D" },
  { name: "إعلانات", value: 30000, color: "#5ED6ED" },
  { name: "رواتب", value: 250000, color: "#312E81" },
  { name: "أدوات", value: 20000, color: "#CBD5E1" },
];

export default function FinancesPage() {
  const totalRevenue = pnlData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalExpense = pnlData.reduce((acc, curr) => acc + curr.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const margin = ((netProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold opacity-70 mb-1">إجمالي الإيرادات</p>
            <h3 className="text-2xl font-headline font-bold">{totalRevenue.toLocaleString()} ج.م</h3>
            <div className="flex items-center text-xs mt-2 text-emerald-300 font-bold">
              <ArrowUpRight className="h-4 w-4 ml-1" /> +15.4% عن العام الماضي
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-500 text-white">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold opacity-70 mb-1">إجمالي المصروفات</p>
            <h3 className="text-2xl font-headline font-bold">{totalExpense.toLocaleString()} ج.م</h3>
            <div className="flex items-center text-xs mt-2 text-rose-100 font-bold">
              <ArrowUpRight className="h-4 w-4 ml-1" /> +2.1% عن الشهر الماضي
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">صافي الربح</p>
            <h3 className="text-2xl font-headline font-bold text-primary">{netProfit.toLocaleString()} ج.م</h3>
            <div className="flex items-center text-xs mt-2 text-emerald-600 font-bold">
              <TrendingUp className="h-4 w-4 ml-1" /> نمو قوي
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">هامش الربح</p>
            <h3 className="text-2xl font-headline font-bold text-accent">{margin}%</h3>
            <div className="flex items-center text-xs mt-2 text-indigo-600 font-bold">
              <Target className="h-4 w-4 ml-1" /> المستهدف: 75%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">الإيرادات حسب النوع</CardTitle>
            <CardDescription>مقارنة بين الإيرادات والتكاليف المرتبطة</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="الإيرادات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="expense" name="المصروفات" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">توزيع المصروفات</CardTitle>
            <CardDescription>أين تذهب ميزانية الوكالة</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
