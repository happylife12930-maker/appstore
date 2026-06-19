
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
      toast({ title: "Error", description: "Failed to generate quotation.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleConvertToProject() {
    toast({
      title: "Success",
      description: "Quotation has been converted to a live project!",
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
                <CardTitle className="text-2xl font-headline">Smart Quotation</CardTitle>
                <CardDescription>Turn client requests into professional estimates using AI.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Client Request Details</label>
              <Textarea 
                placeholder="e.g., I need a cross-platform Android and iOS app for my local bakery. It should have a product catalog, user reviews, and mobile payments."
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing & Estimating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Generate Quotation
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
                    <CardTitle className="font-headline text-2xl">Project Proposal</CardTitle>
                    <p className="text-primary-foreground/70 text-sm">Zenith Agency Estimate</p>
                  </div>
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                    DRAFT
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8 border-b pb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Estimated Cost</p>
                    <p className="text-3xl font-bold text-primary font-headline">${quote.estimatedCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Timeline</p>
                    <p className="text-3xl font-bold text-primary font-headline">{quote.executionTimelineDays} Days</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider">Suggested Requirements</h4>
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
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Manager Notes</h4>
                  <p className="text-sm italic text-muted-foreground">"{quote.notes}"</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 justify-end p-6 border-t bg-muted/20">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={handleConvertToProject}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Convert to Project
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/20">
              <Calculator className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Your generated quotation will appear here</p>
              <p className="text-xs">Fill out the request form to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
