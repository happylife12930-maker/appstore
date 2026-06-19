
"use client";

import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";

const appTypes = [
  { name: "E-commerce", value: 45 },
  { name: "Fintech", value: 30 },
  { name: "Health", value: 15 },
  { name: "CRM/ERP", value: 10 },
];

const bugDensity = [
  { project: "Zenith CRM", bugs: 12, quality: 95 },
  { project: "EcoMobile", bugs: 28, quality: 82 },
  { project: "HealthTracker", bugs: 8, quality: 98 },
  { project: "Fintech Port", bugs: 15, quality: 91 },
];

const durationData = [
  { month: "Jan", avgDays: 45 },
  { month: "Feb", avgDays: 42 },
  { month: "Mar", avgDays: 38 },
  { month: "Apr", avgDays: 35 },
];

const COLORS = ["#364E7D", "#5ED6ED", "#312E81", "#CBD5E1"];

export default function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Most Requested App Types</CardTitle>
            <CardDescription>Breakdown by industry</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appTypes}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Project Quality vs Bug Density</CardTitle>
            <CardDescription>Bugs per project against quality score</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bugDensity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="project" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="bugs" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="quality" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Average Delivery Duration</CardTitle>
            <CardDescription>Efficiency tracking across months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durationData}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5ED6ED" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5ED6ED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="avgDays" stroke="#364E7D" fillOpacity={1} fill="url(#colorDays)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
