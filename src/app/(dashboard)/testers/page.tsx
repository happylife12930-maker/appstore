
"use client";

import * as React from "react";
import { useState } from "react";
import { 
  Users, 
  Plus, 
  LayoutGrid, 
  Smartphone, 
  Mail, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";

const initialGroups = [
  {
    id: "g1",
    name: "مجموعة فحص الأداء",
    app: "Zenith CRM Mobile",
    testers: [
      { id: "t1", name: "محمد علي", email: "mohammed@example.com", progress: 85, days: ["sun", "tue", "thu"], done: true },
      { id: "t2", name: "ياسين عمر", email: "yassin@example.com", progress: 40, days: ["mon", "wed"], done: false },
    ]
  },
  {
    id: "g2",
    name: "مجموعة فحص الواجهة",
    app: "EcoMobile App",
    testers: [
      { id: "t3", name: "ليلى حسن", email: "laila@example.com", progress: 100, days: ["sun", "mon", "tue", "wed", "thu"], done: true },
    ]
  }
];

export default function TestersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [groups, setGroups] = useState(initialGroups);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddTesterOpen, setIsAddTesterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [newGroup, setNewGroup] = useState({ name: "", app: "" });
  const [newTester, setNewTester] = useState({ name: "", email: "" });

  const handleAddGroup = () => {
    if (!newGroup.name || !newGroup.app) return;
    const group = {
      id: `g${groups.length + 1}`,
      name: newGroup.name,
      app: newGroup.app,
      testers: []
    };
    setGroups([...groups, group]);
    setNewGroup({ name: "", app: "" });
    setIsAddGroupOpen(false);
    toast({ title: "تمت الإضافة", description: "تم إنشاء مجموعة اختبار جديدة بنجاح." });
  };

  const handleAddTester = () => {
    if (!newTester.name || !newTester.email || !selectedGroupId) return;
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          testers: [
            ...g.testers,
            { 
              id: `t${Date.now()}`, 
              name: newTester.name, 
              email: newTester.email, 
              progress: 0, 
              days: ["sun", "mon", "tue"], 
              done: false 
            }
          ]
        };
      }
      return g;
    });
    setGroups(updatedGroups);
    setNewTester({ name: "", email: "" });
    setIsAddTesterOpen(false);
    toast({ title: "تمت الإضافة", description: "تمت إضافة المختبر إلى المجموعة." });
  };

  const toggleTaskStatus = (groupId: string, testerId: string) => {
    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          testers: g.testers.map(t => {
            if (t.id === testerId) {
              return { ...t, done: !t.done, progress: !t.done ? 100 : t.progress };
            }
            return t;
          })
        };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline font-bold">{t('testers')}</h2>
          <p className="text-muted-foreground text-sm">إدارة فرق فحص تطبيقات الأندرويد ومتابعة جداولهم.</p>
        </div>
        <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold"><Plus className="mr-2 h-4 w-4" /> {t('addGroup')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addGroup')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">{t('groupName')}</label>
                <Input value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} placeholder="مثلاً: فحص أندرويد 14" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">{t('assignedApp')}</label>
                <Input value={newGroup.app} onChange={(e) => setNewGroup({...newGroup, app: e.target.value})} placeholder="اسم التطبيق" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddGroup}>{t('addGroup')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  {group.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Smartphone className="h-3 w-3" />
                  {t('assignedApp')}: {group.app}
                </CardDescription>
              </div>
              <Dialog open={isAddTesterOpen && selectedGroupId === group.id} onOpenChange={(val) => {
                setIsAddTesterOpen(val);
                if (val) setSelectedGroupId(group.id);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="font-bold">
                    <Plus className="mr-1 h-4 w-4" /> {t('addMember')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addMember')} - {group.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">{t('testerName')}</label>
                      <Input value={newTester.name} onChange={(e) => setNewTester({...newTester, name: e.target.value})} placeholder="الاسم الكامل" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">{t('email')}</label>
                      <Input value={newTester.email} onChange={(e) => setNewTester({...newTester, email: e.target.value})} placeholder="example@mail.com" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTester}>{t('addMember')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[200px]">{t('testerName')}</TableHead>
                    <TableHead>{t('testingDays')}</TableHead>
                    <TableHead>{t('progressRate')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.testers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا يوجد مختبرين في هذه المجموعة حالياً.
                      </TableCell>
                    </TableRow>
                  ) : (
                    group.testers.map((tester) => (
                      <TableRow key={tester.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tester.name}</p>
                              <p className="text-[10px] text-muted-foreground">{tester.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {weekDays.map(day => (
                              <Badge 
                                key={day} 
                                variant={tester.days.includes(day) ? "default" : "outline"}
                                className={`text-[9px] px-1.5 py-0 ${tester.days.includes(day) ? 'bg-primary' : 'text-muted-foreground opacity-30'}`}
                              >
                                {t(day)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{tester.progress}%</span>
                            </div>
                            <Progress value={tester.progress} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {tester.done ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {t('taskDone')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none">
                              <Clock className="h-3 w-3 mr-1" /> {t('taskPending')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`font-bold ${tester.done ? 'text-rose-500' : 'text-emerald-600'}`}
                            onClick={() => toggleTaskStatus(group.id, tester.id)}
                          >
                            {tester.done ? 'إلغاء الإتمام' : 'اعتماد الإنجاز'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
