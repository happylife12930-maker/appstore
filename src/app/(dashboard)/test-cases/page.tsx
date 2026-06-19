
"use client";

import * as React from "react";
import { useState } from "react";
import { ShieldCheck, Loader2, Plus, Play, CheckCircle, XCircle, Clock } from "lucide-react";
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

export default function TestCasesPage() {
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
              <CardTitle className="text-2xl font-headline">AI Test Case Generator</CardTitle>
              <CardDescription>Describe your feature to automatically generate comprehensive test scenarios.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="e.g., A login screen with email, password, and 'Forgot Password' link. It should validate email format and password strength."
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Test Cases
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card className="shadow-sm border-none overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-muted/50">
            <CardTitle className="font-headline">Generated Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Expected Result</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.testCases.map((tc) => (
                  <TableRow key={tc.testCaseId}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {tc.testCaseId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium mb-1">{tc.scenario}</div>
                      <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
                        {tc.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tc.expectedResult}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4 mr-2" /> Run
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manual Table for Tracking */}
      {!results && (
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">Active Test Execution</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">TC-001</TableCell>
                  <TableCell>Auth Flow</TableCell>
                  <TableCell><Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100"><CheckCircle className="w-3 h-3 mr-1" /> Passed</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">2h ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">TC-002</TableCell>
                  <TableCell>Payment Gateway</TableCell>
                  <TableCell><Badge variant="outline" className="text-rose-500 bg-rose-50 border-rose-100"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">1d ago</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">TC-003</TableCell>
                  <TableCell>Image Upload</TableCell>
                  <TableCell><Badge variant="outline" className="text-amber-500 bg-amber-50 border-amber-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
