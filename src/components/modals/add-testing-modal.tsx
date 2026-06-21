
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
  FileText,
  Phone,
  Edit3,
  RotateCcw
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
    phone: string;
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

// تم توحيد الأسماء مع جدول المواعيد
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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
  const [newTesterPhone, setNewTesterPhone] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [editingTesterIndex, setEditingTesterIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        status: doc.data().status 
      })));
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
    setEditingTesterIndex(null);
    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
  }, [initialData, isOpen]);

  const filteredProjects = useMemo(() => {
    const s = projectSearch.toLowerCase().trim();
    const availableProjects = projects.filter(p => {
      const isNotCompleted = p.status !== 'مكتمل';
      const isCurrentlySelected = p.id === formData.projectId;
      return isNotCompleted || isCurrentlySelected;
    });

    if (!s) return availableProjects;
    return availableProjects.filter(p => p.name.toLowerCase().includes(s));
  }, [projects, projectSearch, formData.projectId]);

  const handleTesterAction = () => {
    if (!newTesterEmail.includes('@') || selectedDays.length === 0) return;

    if (editingTesterIndex !== null) {
      const updatedTesters = [...formData.testers];
      updatedTesters[editingTesterIndex] = { 
        email: newTesterEmail, 
        phone: newTesterPhone, 
        assignedDays: selectedDays 
      };
      setFormData(prev => ({ ...prev, testers: updatedTesters }));
      setEditingTesterIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        testers: [...prev.testers, { email: newTesterEmail, phone: newTesterPhone, assignedDays: selectedDays }]
      }));
    }

    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
  };

  const startEditingTester = (index: number) => {
    const tester = formData.testers[index];
    setNewTesterEmail(tester.email);
    setNewTesterPhone(tester.phone);
    setSelectedDays(tester.assignedDays);
    setEditingTesterIndex(index);
  };

  const cancelEditing = () => {
    setEditingTesterIndex(null);
    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
  };

  const removeTester = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testers: prev.testers.filter((_, i) => i !== index)
    }));
    if (editingTesterIndex === index) {
      cancelEditing();
    }
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
              اختر المشروع، حدد فريق الاختبار وجدول المواعيد بدقة
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[75vh] p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> المشروع المستهدف
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="ابحث عن مشروع..." 
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
                      <SelectValue placeholder="اختر المشروع..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-bold max-h-[250px]">
                      {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{p.name}</span>
                            {p.status === 'مكتمل' && <Badge className="mr-2 bg-green-500 scale-75">مكتمل</Badge>}
                          </div>
                        </SelectItem>
                      ))}
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

            <div className={`p-6 rounded-[2.5rem] border transition-all space-y-6 ${editingTesterIndex !== null ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2">
                {editingTesterIndex !== null ? (
                  <>
                    <Edit3 className="h-5 w-5 text-orange-500" /> تعديل بيانات المختبر
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" /> إضافة مختبر وتحديد الأيام
                  </>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="بريد المختبر..." 
                    className="pr-10 rounded-2xl h-12 border-slate-200 font-bold" 
                    value={newTesterEmail}
                    onChange={(e) => setNewTesterEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="رقم الهاتف..." 
                    className="pr-10 rounded-2xl h-12 border-slate-200 font-bold" 
                    value={newTesterPhone}
                    onChange={(e) => setNewTesterPhone(e.target.value)}
                  />
                </div>
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
              <div className="flex gap-2">
                <Button 
                  onClick={handleTesterAction} 
                  className={`flex-1 rounded-2xl h-12 px-6 font-black gap-2 shadow-md ${editingTesterIndex !== null ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                >
                  {editingTesterIndex !== null ? 'تحديث بيانات المختبر' : 'إضافة المختبر للقائمة'}
                </Button>
                {editingTesterIndex !== null && (
                  <Button variant="outline" onClick={cancelEditing} className="rounded-2xl h-12 px-4 font-black text-slate-500 border-slate-200">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-black text-slate-800 pr-2 uppercase text-xs">فريق الاختبار المعين</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.testers.map((tester, idx) => (
                  <div key={idx} className={`p-4 rounded-3xl border flex flex-col gap-2 relative shadow-sm group transition-all ${editingTesterIndex === idx ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'bg-white border-slate-100'}`}>
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => startEditingTester(idx)} className="h-7 w-7 rounded-lg text-primary"><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeTester(idx)} className="h-7 w-7 rounded-lg text-rose-50"><X className="h-4 w-4 text-rose-500" /></Button>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-xs text-slate-800">{tester.email}</p>
                      {tester.phone && <p className="text-[10px] font-bold text-slate-400" dir="ltr">{tester.phone}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tester.assignedDays.map(d => (
                        <Badge key={d} variant="outline" className="text-[8px] font-black rounded-md px-2 py-0.5 bg-slate-50">{d}</Badge>
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
                  <FileText className="h-4 w-4 text-primary" /> ملاحظات للمختبرين
                </Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="اكتب تعليماتك هنا..." 
                  className="rounded-2xl min-h-[100px] border-slate-200 font-bold"
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
            {initialData ? 'حفظ التعديلات' : 'بدء عملية الاختبار'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
