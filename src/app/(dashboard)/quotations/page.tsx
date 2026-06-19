"use client";

import * as React from "react";
import { useState } from "react";
import { Calculator, Loader2, Sparkles, Send, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { generateProjectQuotation, GenerateProjectQuotationOutput } from "@/ai/flows/generate-project-quotation-flow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function QuotationsPage() {
  const { toast } = useToast();
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<GenerateProjectQuotationOutput | null>(null);

  async function handleGenerate() {
    if (!request.trim()) return;
    setLoading(true);
    try {
      const data = await generateProjectQuotation({ clientRequestDescription: request });
      setQuote(data);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إنشاء عرض السعر.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleConvertToProject() {
    toast({
      title: "نجاح",
      description: "تم تحويل عرض السعر إلى مشروع مباشر بنجاح!",
    });
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-none h-fit sticky top-24">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">عرض سعر ذكي</CardTitle>
                <CardDescription>حول طلبات العملاء إلى عروض أسعار احترافية باستخدام الذكاء الاصطناعي.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">تفاصيل طلب العميل</label>
              <Textarea 
                placeholder="مثلاً: أحتاج لتطبيق أندرويد لمتجري الخاص بالمخبوزات. يجب أن يحتوي على كتالوج منتجات، تقييمات، ودفع إلكتروني."
                className="min-h-[200px] resize-none"
                value={request}
                onChange={(e) => setRequest(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !request.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل والتقدير...
                </>
              ) : (
                <>
                  <Calculator className="ml-2 h-4 w-4" />
                  إنشاء عرض سعر
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {quote ? (
            <Card className="shadow-lg border-none animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-2xl">مقترح المشروع</CardTitle>
                    <p className="text-primary-foreground/70 text-sm">تقدير وكالة Zenith Agency</p>
                  </div>
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                    مسودة
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8 border-b pb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">التكلفة التقديرية</p>
                    <p className="text-2xl font-bold text-primary font-headline">{quote.estimatedCost.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">مدة التنفيذ</p>
                    <p className="text-2xl font-bold text-primary font-headline">{quote.executionTimelineDays} يوم</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider">المتطلبات المقترحة</h4>
                  <ul className="space-y-3">
                    {quote.suggestedRequirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">ملاحظات المدير</h4>
                  <p className="text-sm italic text-muted-foreground">"{quote.notes}"</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 justify-end p-6 border-t bg-muted/20">
                <Button variant="outline">
                  <Download className="ml-2 h-4 w-4" /> تصدير PDF
                </Button>
                <Button onClick={handleConvertToProject}>
                  <ExternalLink className="ml-2 h-4 w-4" /> تحويل لمشروع
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/20">
              <Calculator className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">سيظهر عرض السعر المنشأ هنا</p>
              <p className="text-xs">املأ نموذج الطلب للبدء</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
