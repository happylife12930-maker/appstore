
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
  { name: "App Dev", revenue: 45000, expense: 12000 },
  { name: "UI Design", revenue: 15000, expense: 5000 },
  { name: "Testing", revenue: 8000, expense: 2000 },
  { name: "Maint.", revenue: 12000, expense: 4000 },
];

const expenseBreakdown = [
  { name: "Hosting", value: 4500, color: "#364E7D" },
  { name: "Ads", value: 3000, color: "#5ED6ED" },
  { name: "Salaries", value: 25000, color: "#312E81" },
  { name: "Tools", value: 2000, color: "#CBD5E1" },
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
            <p className="text-xs uppercase font-bold opacity-70 mb-1">Total Revenue</p>
            <h3 className="text-3xl font-headline font-bold">${totalRevenue.toLocaleString()}</h3>
            <div className="flex items-center text-xs mt-2 text-emerald-300 font-bold">
              <ArrowUpRight className="h-4 w-4 mr-1" /> +15.4% vs last year
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-500 text-white">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold opacity-70 mb-1">Total Expenses</p>
            <h3 className="text-3xl font-headline font-bold">${totalExpense.toLocaleString()}</h3>
            <div className="flex items-center text-xs mt-2 text-rose-100 font-bold">
              <ArrowUpRight className="h-4 w-4 mr-1" /> +2.1% vs last month
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Net Profit</p>
            <h3 className="text-3xl font-headline font-bold text-primary">${netProfit.toLocaleString()}</h3>
            <div className="flex items-center text-xs mt-2 text-emerald-600 font-bold">
              <TrendingUp className="h-4 w-4 mr-1" /> Strong growth
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Profit Margin</p>
            <h3 className="text-3xl font-headline font-bold text-accent">{margin}%</h3>
            <div className="flex items-center text-xs mt-2 text-indigo-600 font-bold">
              <Target className="h-4 w-4 mr-1" /> Target: 75%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">Revenue by Stream</CardTitle>
            <CardDescription>Comparison of revenue vs associated costs</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="expense" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">Expense Distribution</CardTitle>
            <CardDescription>Where your agency is spending money</CardDescription>
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
