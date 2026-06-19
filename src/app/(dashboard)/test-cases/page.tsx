
"use client";

import * as React from "react";
import { useState } from "react";
import { ShieldCheck, Loader2, Plus, Play, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { generateTestCases, GenerateTestCasesOutput } from "@/ai/flows/generate-test-cases-flow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/components/language-provider";

export default function TestCasesPage() {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateTestCasesOutput | null>(null);

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const data = await generateTestCases({ featureDescription: description });
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">{t('testCases')}</CardTitle>
              <CardDescription>Describe your feature to automatically generate comprehensive test scenarios.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="e.g., A login screen with email, password, and 'Forgot Password' link."
            className="min-h-[120px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !description.trim()}
              className="px-8"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {loading ? 'Generating...' : t('testCases')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="font-headline text-lg">Active Test Execution</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t('scenario')}</TableHead>
                <TableHead>{t('expectedResult')}</TableHead>
                <TableHead>{t('actualResult')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs font-bold text-primary">TC-001</TableCell>
                <TableCell className="font-medium">User Login with Valid Credentials</TableCell>
                <TableCell className="text-xs">User redirected to Dashboard</TableCell>
                <TableCell className="text-xs italic">Redirected successfully</TableCell>
                <TableCell><Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100">Passed</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs font-bold text-primary">TC-002</TableCell>
                <TableCell className="font-medium">Payment Gateway Redirect</TableCell>
                <TableCell className="text-xs">Redirect to Stripe Portal</TableCell>
                <TableCell className="text-xs italic text-rose-500 font-bold">404 Error Encountered</TableCell>
                <TableCell><Badge variant="outline" className="text-rose-500 bg-rose-50 border-rose-100">Failed</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
