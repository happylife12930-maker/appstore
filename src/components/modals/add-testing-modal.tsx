'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserPlus, 
  Mail, 
  Calendar, 
  Link as LinkIcon, 
  Loader2,
  CheckCircle2,
  X,
  Search,
  Briefcase,
  FileText
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TestingGroupData {
  id?: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'in_progress' | 'completed';
  testers: {
    email: string;
    assignedDays: string[];
  }[];
  resourceLink: string;
  notes: string;
}

interface AddTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TestingGroupData) => Promise<void>;
  isLoading: boolean;
  initialData?: TestingGroupData | null;
}

const DAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export function AddTestingModal({ isOpen, onClose, onSave, isLoading, initialData }: AddTestingModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [formData, setFormData] = useState<TestingGroupData>({
    projectId: '',
    projectName: '',
    status: 'pending',
    testers: [],
    resourceLink: '',
    notes: ''
  });

  const [newTesterEmail, setNewTesterEmail] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
      setProjectSearch('');
    } else if (isOpen) {
      setFormData({
        projectId: '',
        projectName: '',
        status: 'pending',
        testers: [],
        resourceLink: '',
        notes: ''
      });
      setProjectSearch('');
    }
  }, [initialData, isOpen]);

  const filteredProjects = useMemo(() => {
    const s = projectSearch.toLowerCase().trim();
    if (!s) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(s));
  }, [projects, projectSearch]);

  const addTester = () => {
    if (!newTesterEmail.includes('@') || selectedDays.length === 0) return;
    setFormData(prev => ({
      ...prev,
      testers: [...prev.testers, { email: newTesterEmail, assignedDays: selectedDays }]
    }));
    setNewTesterEmail('');
    setSelectedDays([]);
  };

  const removeTester = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testers: prev.testers.filter((_, i) => i !== index)
    }));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!formData.projectId) return;
    const project = projects.find(p => p.id === formData.projectId);
    onSave({ ...formData, projectName: project?.name || '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Calendar className="h-6 w-6" /> {initialData ? 'تعديل مهمة الاختبار' : 'تعيين مشروع للاختبار'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold mt-1">
              اختر المشروع، حدد فريق الاختبار وجدول المواعيد
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[75vh] p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> المشروع المستهدف (بحث)
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="اكتب اسم المشروع للبحث..." 
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="rounded-2xl h-12 pr-10 border-slate-200 font-bold text-sm bg-slate-50/50"
                    />
                  </div>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(val) => {
                      setFormData({...formData, projectId: val});
                      setProjectSearch('');
                    }}
                  >
                    <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-black text-right">
                      <SelectValue placeholder="اختر من النتائج..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-bold max-h-[250px]">
                      {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {filteredProjects.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400 font-bold">لا توجد مشاريع مطابقة</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <Label className="font-black text-slate-700 pr-2">حالة الاختبار</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-black mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl font-bold">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">جارِ الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل (تم الفحص)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2">
                <UserPlus className="h-5 w-5 text-primary" /> إضافة مختبر وتحديد الأيام
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="بريد المختبر..." 
                      className="pr-10 rounded-2xl h-12 border-slate-200 font-bold" 
                      value={newTesterEmail}
                      onChange={(e) => setNewTesterEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={addTester} className="rounded-2xl h-12 px-6 font-black gap-2">
                    إضافة للقائمة
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Label className="font-black text-[10px] text-slate-400 uppercase pr-2">أيام العمل المحددة لهذا المختبر</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <div 
                        key={day} 
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all font-black text-xs ${
                          selectedDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-black text-slate-800 pr-2 uppercase text-xs">فريق الاختبار المعين</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.testers.map((tester, idx) => (
                  <div key={idx} className="p-4 rounded-3xl bg-white border border-slate-100 flex flex-col gap-2 relative shadow-sm group">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeTester(idx)}
                      className="absolute top-2 left-2 h-7 w-7 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="font-black text-xs text-slate-800">{tester.email}</p>
                    <div className="flex flex-wrap gap-1">
                      {tester.assignedDays.map(d => (
                        <Badge key={d} variant="outline" className="text-[8px] font-black rounded-md px-2 py-0.5 bg-slate-50">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> رابط نسخة الاختبار / المرفقات
                </Label>
                <Input 
                  value={formData.resourceLink} 
                  onChange={(e) => setFormData({...formData, resourceLink: e.target.value})} 
                  placeholder="https://..." 
                  className="rounded-2xl h-12 border-slate-200 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> وصف المرفق / ملاحظات للمختبرين
                </Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="اكتب هنا توضيحاً للمختبرين حول هذا الرابط أو أي تعليمات إضافية..." 
                  className="rounded-2xl min-h-[100px] border-slate-200 font-bold leading-relaxed"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-slate-50 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !formData.projectId}
            className="w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-xl active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            {initialData ? 'حفظ تعديلات مجموعة الاختبار' : 'بدء عملية الاختبار'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
