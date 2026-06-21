
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
  Calendar, 
  Loader2,
  CheckCircle2,
  X,
  Phone,
  Briefcase
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

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, status: doc.data().status })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({ projectId: '', projectName: '', status: 'pending', testers: [], resourceLink: '', notes: '' });
    }
    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
  }, [initialData, isOpen]);

  const handleTesterAction = () => {
    if (!newTesterEmail.includes('@') || selectedDays.length === 0) return;
    setFormData(prev => ({ 
      ...prev, 
      testers: [...prev.testers, { email: newTesterEmail, phone: newTesterPhone, assignedDays: [...selectedDays] }] 
    }));
    setNewTesterEmail(''); setNewTesterPhone(''); setSelectedDays([]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const removeTester = (idx: number) => {
    setFormData(prev => ({ ...prev, testers: prev.testers.filter((_, i) => i !== idx) }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] rounded-[1.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calendar className="h-5 w-5" /> {initialData ? 'تعديل مهمة الاختبار' : 'إضافة مهمة اختبار'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[65vh] p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-700 pr-1">المشروع المستهدف</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs font-bold"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-700 pr-1">حالة الاختبار</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <p className="text-[11px] font-black text-primary uppercase">إضافة مختبر جديد</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="البريد الإلكتروني" className="rounded-lg h-9 text-xs border-slate-200 font-bold" value={newTesterEmail} onChange={e => setNewTesterEmail(e.target.value)} />
                <Input placeholder="رقم الهاتف" className="rounded-lg h-9 text-xs border-slate-200 font-bold" value={newTesterPhone} onChange={e => setNewTesterPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400">أيام العمل:</p>
                <div className="flex flex-wrap gap-1">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)} className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${selectedDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleTesterAction} size="sm" className="w-full h-9 rounded-lg font-black text-xs gap-2">
                <UserPlus className="h-3.5 w-3.5" /> إضافة للفريق
              </Button>

              {formData.testers.length > 0 && (
                <div className="pt-3 space-y-1.5">
                   <div className="space-y-1.5">
                      {formData.testers.map((t, i) => (
                        <div key={i} className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                          <div className="overflow-hidden">
                            <p className="font-bold text-[10px] text-slate-800 truncate">{t.email}</p>
                            <p className="text-[8px] text-slate-400">{t.assignedDays.join('، ')}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTester(i)} className="h-6 w-6 text-rose-300">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-700 pr-1">رابط النسخة</Label>
                <Input value={formData.resourceLink} onChange={e => setFormData({...formData, resourceLink: e.target.value})} className="rounded-xl h-10 text-xs border-slate-200" placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-700 pr-1">تعليمات إضافية</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-xl text-xs min-h-[80px] border-slate-200" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-slate-50 border-t">
          <Button onClick={() => onSave({...formData, projectName: projects.find(p=>p.id===formData.projectId)?.name || ''})} disabled={isLoading || !formData.projectId || formData.testers.length === 0} className="w-full h-12 rounded-xl font-black text-base shadow-xl gap-2">
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            اعتماد مهمة الاختبار
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
