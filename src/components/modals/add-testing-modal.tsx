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
  X,
  Plus,
  Edit2
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
    });
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
      if (editingTesterIdx !== null) {
        newTesters[editingTesterIdx] = testerData;
      } else {
        newTesters.push(testerData);
      }
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

  const removeTester = (idx: number) => {
    setFormData(prev => ({ ...prev, testers: prev.testers.filter((_, i) => i !== idx) }));
    if (editingTesterIdx === idx) resetTesterForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-3 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {initialData ? 'تعديل المهمة' : 'تعيين مشروع للاختبار'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh] p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-700">المشروع</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="rounded-lg h-8 border-slate-200 text-[11px] font-bold"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent className="rounded-lg font-bold">
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-700">حالة المهمة</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-lg h-8 border-slate-200 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg font-bold">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-primary uppercase">
                   {editingTesterIdx !== null ? 'تعديل بيانات المختبر' : 'إضافة مختبر جديد'}
                 </p>
                 {editingTesterIdx !== null && (
                   <Button variant="ghost" size="sm" onClick={resetTesterForm} className="h-6 text-[9px] text-rose-500 font-bold px-1">إلغاء</Button>
                 )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="البريد الإلكتروني" className="rounded-lg h-8 text-[11px] font-bold" value={newTesterEmail} onChange={e => setNewTesterEmail(e.target.value)} />
                <Input placeholder="رقم الهاتف" className="rounded-lg h-8 text-[11px] font-bold" value={newTesterPhone} onChange={e => setNewTesterPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400">أيام العمل المطلوب التواجد فيها:</p>
                <div className="flex flex-wrap gap-1">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)} className={`px-2 py-0.5 rounded-md text-[9px] font-black border transition-all ${selectedDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleTesterAction} size="sm" className={`w-full h-8 rounded-lg font-black text-[10px] gap-1.5 ${editingTesterIdx !== null ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : ''}`}>
                {editingTesterIdx !== null ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {editingTesterIdx !== null ? 'تحديث وحفظ المختبر' : 'إضافة المختبر للقائمة المؤقتة'}
              </Button>

              {formData.testers.length > 0 && (
                <div className="pt-2 grid grid-cols-1 gap-1.5">
                  {formData.testers.map((t, i) => (
                    <div key={i} className={`bg-white p-2 rounded-lg border flex justify-between items-center group ${editingTesterIdx === i ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-slate-100'}`}>
                      <div className="overflow-hidden">
                        <p className="font-black text-[10px] text-slate-800 truncate">{t.email}</p>
                        <p className="text-[8px] text-slate-400 font-bold">{t.assignedDays.join('، ')}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => startEditTester(i)} className="h-6 w-6 text-blue-500 hover:bg-blue-50">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeTester(i)} className="h-6 w-6 text-rose-300 hover:text-rose-500">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-700">رابط نسخة الاختبار</Label>
                <Input value={formData.resourceLink} onChange={e => setFormData({...formData, resourceLink: e.target.value})} className="rounded-lg h-8 text-[10px]" placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-700">تعليمات للمختبرين</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-lg text-[10px] min-h-[50px]" placeholder="مثال: يرجى التركيز على واجهة تسجيل الدخول..." />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-3 bg-slate-50 border-t">
          <Button onClick={() => onSave({...formData, projectName: projects.find(p=>p.id===formData.projectId)?.name || ''})} disabled={isLoading || !formData.projectId || formData.testers.length === 0} className="w-full h-9 rounded-xl font-black text-xs shadow-md gap-2">
            {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            اعتماد وحفظ كافة البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}