
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Loader2,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function AddTestingModal({ isOpen, onClose, onSave, isLoading, initialData }: AddTestingModalProps) {
  const [projects, setProjects] = useState<any[]>([]);
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
  const [editingTesterIdx, setEditingTesterIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({ projectId: '', projectName: '', status: 'pending', testers: [], resourceLink: '', notes: '' });
    }
    resetTesterForm();
  }, [initialData, isOpen]);

  const resetTesterForm = () => {
    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
    setEditingTesterIdx(null);
  };

  const handleTesterAction = () => {
    if (!newTesterEmail.includes('@') || selectedDays.length === 0) return;
    const testerData = { email: newTesterEmail, phone: newTesterPhone, assignedDays: [...selectedDays] };
    
    setFormData(prev => {
      const newTesters = [...prev.testers];
      if (editingTesterIdx !== null) newTesters[editingTesterIdx] = testerData;
      else newTesters.push(testerData);
      return { ...prev, testers: newTesters };
    });
    resetTesterForm();
  };

  const startEditTester = (idx: number) => {
    const t = formData.testers[idx];
    setNewTesterEmail(t.email);
    setNewTesterPhone(t.phone);
    setSelectedDays([...t.assignedDays]);
    setEditingTesterIdx(idx);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[750px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col" 
        dir="rtl"
      >
        {/* Header - Fixed */}
        <div className="bg-primary p-6 text-primary-foreground shrink-0 shadow-md z-30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Calendar className="h-7 w-7" /> {initialData ? 'تعديل مهمة الاختبار' : 'تعيين مشروع للاختبار'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Unified Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8 space-y-10 custom-scrollbar">
          <div className="space-y-10 pr-2">
            {/* Project Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 pr-1 uppercase tracking-widest">المشروع المستهدف</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="rounded-2xl h-14 font-black bg-slate-50 border-slate-100 shadow-sm">
                    <SelectValue placeholder="اختر المشروع..." />
                  </SelectTrigger>
                  <SelectContent className="font-bold rounded-2xl">
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 pr-1 uppercase tracking-widest">حالة الاختبار</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-2xl h-14 font-black bg-slate-50 border-slate-100 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-bold rounded-2xl">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Tester Section */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-6 shadow-inner">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> {editingTesterIdx !== null ? 'تعديل بيانات مختبر' : 'إضافة مختبر جديد للفريق'}
                </h3>
                {editingTesterIdx !== null && (
                  <Button variant="ghost" size="sm" onClick={resetTesterForm} className="text-[10px] font-black text-rose-500 h-8 bg-white shadow-sm hover:bg-rose-50 px-4 rounded-xl">إلغاء التعديل</Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 mr-2 uppercase">البريد الإلكتروني</Label>
                  <Input 
                    placeholder="example@mail.com" 
                    className="rounded-xl h-12 font-bold text-sm bg-white shadow-sm border-slate-100" 
                    value={newTesterEmail} 
                    onChange={e => setNewTesterEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 mr-2 uppercase">رقم الهاتف (واتساب)</Label>
                  <Input 
                    placeholder="01xxxxxxxxx" 
                    className="rounded-xl h-12 font-bold text-sm bg-white shadow-sm border-slate-100" 
                    value={newTesterPhone} 
                    onChange={e => setNewTesterPhone(e.target.value)} 
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 mr-2 uppercase">أيام الاختبار المقررة له</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button 
                      key={day} 
                      type="button"
                      onClick={() => toggleDay(day)} 
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black border transition-all",
                        selectedDays.includes(day) 
                          ? 'bg-primary text-white border-primary shadow-md scale-105' 
                          : 'bg-white text-slate-400 border-slate-200 hover:border-primary/40'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleTesterAction} 
                disabled={!newTesterEmail.includes('@') || selectedDays.length === 0}
                className="w-full h-14 rounded-2xl font-black gap-2 shadow-xl active:scale-95 transition-all bg-slate-900 text-white hover:bg-black"
              >
                {editingTesterIdx !== null ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingTesterIdx !== null ? 'تحديث بيانات المختبر' : 'تأكيد إضافة المختبر للقائمة'}
              </Button>

              {/* List of Testers Added */}
              {formData.testers.length > 0 && (
                <div className="pt-6 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex justify-between items-center">
                    <span>فريق الاختبار المضاف ({formData.testers.length})</span>
                    <span className="h-px flex-1 bg-slate-200 mx-3"></span>
                  </h4>
                  <div className="space-y-3">
                    {formData.testers.map((t, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm group hover:border-primary/20 transition-all">
                        <div className="overflow-hidden">
                          <p className="font-black text-sm text-slate-800 truncate">{t.email}</p>
                          <div className="flex gap-1.5 flex-wrap mt-2">
                            {t.assignedDays.map(d => (
                              <Badge key={d} variant="outline" className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg border-primary/10">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditTester(i)} className="h-9 w-9 rounded-xl text-blue-500 hover:bg-blue-50">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setFormData(p=>({...p, testers: p.testers.filter((_,idx)=>idx!==i)}))} className="h-9 w-9 rounded-xl text-rose-400 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info Section */}
            <div className="space-y-8 pb-4">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-1 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> رابط النسخة والمرفقات
                </Label>
                <Input 
                  value={formData.resourceLink} 
                  onChange={e => setFormData({...formData, resourceLink: e.target.value})} 
                  className="rounded-2xl h-14 border-slate-100 bg-slate-50 font-bold text-sm shadow-sm" 
                  placeholder="https://test-link.com/..." 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> تعليمات وملاحظات الجودة
                </Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="rounded-[2rem] min-h-[160px] border-slate-100 bg-slate-50 font-bold text-sm leading-relaxed p-6 shadow-sm" 
                  placeholder="اكتب هنا التعليمات التي تظهر للمختبرين عند إرسال التنبيهات لهم..." 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-8 bg-slate-50 border-t shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-30">
          <Button 
            onClick={() => onSave({...formData, projectName: projects.find(p=>p.id===formData.projectId)?.name || ''})} 
            disabled={isLoading || !formData.projectId || formData.testers.length === 0} 
            className="w-full h-16 rounded-[2rem] font-black text-xl gap-3 shadow-2xl hover:scale-[1.01] active:scale-95 transition-all bg-primary"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
            حفظ المهمة والجدول بالكامل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
