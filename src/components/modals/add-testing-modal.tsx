
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
    setEditingTesterIndex(null);
    setNewTesterEmail('');
    setNewTesterPhone('');
    setSelectedDays([]);
  }, [initialData, isOpen]);

  const filteredProjects = useMemo(() => {
    const s = projectSearch.toLowerCase().trim();
    const available = projects.filter(p => p.status !== 'مكتمل' || p.id === formData.projectId);
    return s ? available.filter(p => p.name.toLowerCase().includes(s)) : available;
  }, [projects, projectSearch, formData.projectId]);

  const handleTesterAction = () => {
    if (!newTesterEmail.includes('@') || selectedDays.length === 0) return;
    if (editingTesterIndex !== null) {
      const updated = [...formData.testers];
      updated[editingTesterIndex] = { email: newTesterEmail, phone: newTesterPhone, assignedDays: [...selectedDays] };
      setFormData(prev => ({ ...prev, testers: updated }));
      setEditingTesterIndex(null);
    } else {
      setFormData(prev => ({ ...prev, testers: [...prev.testers, { email: newTesterEmail, phone: newTesterPhone, assignedDays: [...selectedDays] }] }));
    }
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
      <DialogContent className="sm:max-w-[650px] w-[95vw] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Calendar className="h-6 w-6" /> {initialData ? 'تعديل مهمة الاختبار' : 'إضافة مهمة اختبار'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold text-xs">
              حدد المشروع والمختبرين وأيام العمل بدقة
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[70vh] p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-700 pr-2">المشروع المستهدف</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-bold"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent className="rounded-2xl font-bold">
                    {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-700 pr-2">حالة الاختبار</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl font-bold">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4 shadow-inner">
              <Label className="text-xs font-black text-primary uppercase pr-2">إضافة مختبر للفريق</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="البريد الإلكتروني" className="rounded-xl h-11 text-sm border-slate-200 font-bold" value={newTesterEmail} onChange={e => setNewTesterEmail(e.target.value)} />
                <Input placeholder="رقم الهاتف (واتساب)" className="rounded-xl h-11 text-sm border-slate-200 font-bold" value={newTesterPhone} onChange={e => setNewTesterPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 pr-2">أيام الاختبار المقررة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${selectedDays.includes(day) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-primary/50'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleTesterAction} size="sm" className="w-full h-11 rounded-xl font-black text-sm gap-2">
                <UserPlus className="h-4 w-4" /> حفظ بيانات المختبر
              </Button>

              {formData.testers.length > 0 && (
                <div className="pt-4 space-y-2">
                   <p className="text-[10px] font-black text-primary uppercase pr-2">الفريق المضاف ({formData.testers.length})</p>
                   <div className="space-y-2">
                      {formData.testers.map((t, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-xs text-slate-800">{t.email}</p>
                            <p className="text-[9px] text-slate-400">{t.assignedDays.join('، ')}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTester(i)} className="h-8 w-8 text-rose-300 hover:text-rose-500">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-700 pr-2">رابط نسخة التطبيق (Apk/Web)</Label>
                <Input value={formData.resourceLink} onChange={e => setFormData({...formData, resourceLink: e.target.value})} className="rounded-2xl h-12 text-sm border-slate-200" placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-700 pr-2">تعليمات وملاحظات للمختبرين</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-2xl text-sm min-h-[100px] border-slate-200" placeholder="أدخل أي ملاحظات تقنية أو تعليمات خاصة بالاختبار هنا..." />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-slate-50 border-t">
          <Button onClick={() => onSave({...formData, projectName: projects.find(p=>p.id===formData.projectId)?.name || ''})} disabled={isLoading || !formData.projectId || formData.testers.length === 0} className="w-full h-16 rounded-2xl font-black text-xl shadow-2xl gap-3 active:scale-95 transition-all">
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            اعتماد مهمة الاختبار
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
