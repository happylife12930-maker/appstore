"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  CheckCircle,
  BarChart2,
  Bug,
  Clock,
  DollarSign,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    finishedProjects: 0,
    monthlyRevenue: "0 ج.م",
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setStats(prev => ({ ...prev, totalClients: snap.size }));
      setLoading(false);
    });

    const activeProjectsQuery = query(
      collection(db, "projects"), 
      where("status", "!=", "مكتمل"),
      limit(5)
    );
    const unsubActive = onSnapshot(activeProjectsQuery, (snap) => {
      setStats(prev => ({ ...prev, activeProjects: snap.size }));
      setRecentProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const finishedProjectsQuery = query(collection(db, "projects"), where("status", "==", "مكتمل"));
    const unsubFinished = onSnapshot(finishedProjectsQuery, (snap) => {
      setStats(prev => ({ ...prev, finishedProjects: snap.size }));
    });

    return () => {
      unsubClients();
      unsubActive();
      unsubFinished();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">لوحة تحكم APP STORE</h1>
          <p className="text-muted-foreground font-medium">نظرة عامة على أداء الوكالة والعملاء</p>
        </div>
        <Button onClick={() => router.push('/projects')} className="rounded-xl shadow-lg font-bold">إدارة المشاريع</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/clients')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-3xl font-black">{stats.totalClients}</div>}
            <p className="text-xs text-muted-foreground mt-1">عملاء مسجلين في النظام</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">المشاريع الحالية</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">قيد التنفيذ حالياً</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">المشاريع المنتهية</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.finishedProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">تم تسليمها بنجاح</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">الإيرادات التقديرية</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">لهذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">حالة المشاريع النشطة</CardTitle>
            <CardDescription className="font-medium">تتبع نسبة الإنجاز للمشاريع المفتوحة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentProjects.length > 0 ? recentProjects.map((project) => (
              <div key={project.id} className="p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between mb-2">
                  <span className="text-base font-bold text-primary">{project.name}</span>
                  <span className="text-sm font-bold">{project.progress || 0}%</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground font-medium">
                  <span>العميل: {project.client}</span>
                  <span>الحالة: {project.status}</span>
                </div>
                <Progress value={project.progress || 0} className="h-2 rounded-full" />
              </div>
            )) : (
              <div className="py-20 text-center text-muted-foreground font-medium bg-slate-50/50 rounded-3xl">
                لا توجد مشاريع نشطة حالياً.
              </div>
            )}
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/projects')}>عرض كل المشاريع</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                تحليل سريع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">معدل الإنجاز العام</span>
                <span className="font-bold">85%</span>
              </div>
              <Progress value={85} className="bg-white/20 h-2" />
              <p className="text-xs opacity-80">أداء الفريق مستقر هذا الأسبوع.</p>
            </CardContent>
          </Card>
          
          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
                <Bug className="h-4 w-4" />
                المشكلات المعلقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">0</div>
              <p className="text-xs text-muted-foreground">لا توجد بلاغات حالياً</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-500">
                <Clock className="h-4 w-4" />
                طلبات الدفع المتأخرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">0</div>
              <p className="text-xs text-muted-foreground">كافة الفواتير محصلة</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
