
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
      updated[editingTesterIndex] = { email: newTesterEmail, phone: newTesterPhone, assignedDays: selectedDays };
      setFormData(prev => ({ ...prev, testers: updated }));
      setEditingTesterIndex(null);
    } else {
      setFormData(prev => ({ ...prev, testers: [...prev.testers, { email: newTesterEmail, phone: newTesterPhone, assignedDays: selectedDays }] }));
    }
    setNewTesterEmail(''); setNewTesterPhone(''); setSelectedDays([]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] rounded-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calendar className="h-5 w-5" /> {initialData ? 'تعديل مهمة الاختبار' : 'إضافة مهمة اختبار'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[70vh] p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-600">المشروع</Label>
                <Select value={formData.projectId} onValueChange={(v) => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="rounded-xl h-10 font-bold"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-600">الحالة</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-xl h-10 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد الاختبار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <Label className="text-xs font-black text-primary uppercase">إضافة مختبر</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="البريد الإلكتروني" className="rounded-lg h-10 text-xs" value={newTesterEmail} onChange={e => setNewTesterEmail(e.target.value)} />
                <Input placeholder="رقم الهاتف" className="rounded-lg h-10 text-xs" value={newTesterPhone} onChange={e => setNewTesterPhone(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1">
                {DAYS.map(day => (
                  <button key={day} onClick={() => toggleDay(day)} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${selectedDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {day}
                  </button>
                ))}
              </div>
              <Button onClick={handleTesterAction} size="sm" className="w-full h-9 rounded-lg font-black text-xs">حفظ المختبر</Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-600">رابط النسخة</Label>
              <Input value={formData.resourceLink} onChange={e => setFormData({...formData, resourceLink: e.target.value})} className="rounded-xl h-10 text-xs" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-600">ملاحظات</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-xl text-xs min-h-[60px]" />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-slate-50 border-t">
          <Button onClick={() => onSave({...formData, projectName: projects.find(p=>p.id===formData.projectId)?.name || ''})} disabled={isLoading || !formData.projectId} className="w-full h-11 rounded-xl font-black text-sm gap-2">
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            تأكيد المهمة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
