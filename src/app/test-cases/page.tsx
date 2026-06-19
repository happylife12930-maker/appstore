"use client";

import * as React from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TestCasesPage() {
  const router = useRouter();
  return (
    <div className="max-w-4xl mx-auto p-12 text-center space-y-6" dir="rtl">
      <div className="flex justify-start mb-8">
        <Button variant="outline" onClick={() => router.push("/")} className="rounded-xl">
          <Home className="ml-2 h-4 w-4" /> العودة للرئيسية
        </Button>
      </div>
      <h1 className="text-3xl font-bold">إدارة حالات الاختبار</h1>
      <p className="text-muted-foreground">هذا القسم قيد التطوير حالياً.</p>
    </div>
  );
}