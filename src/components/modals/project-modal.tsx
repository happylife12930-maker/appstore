'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Briefcase, Search, Image as ImageIcon, Plus, Trash2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface ProjectData {
  id?: string;
  name: string;
  clientId: string;
  clientName: string;
  requirements: string;
  status: string;
  images: string[];
  progress: number;
  steps: { id: number; title: string; completed: boolean }[];
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectData) => Promise<void>;
  isLoading: boolean;
  initialData?: ProjectData | null;
}

export function ProjectModal({ isOpen, onClose, onSave, isLoading, initialData }: ProjectModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    clientId: '',
    clientName: '',
    requirements: '',
    status: 'قيد التنفيذ',
    images: [],
    progress: 0,
    steps: [
      { id: 1, title: 'تحليل المتطلبات', completed: false },
      { id: 2, title: 'تصميم الواجهات UI/UX', completed: false },
      { id: 3, title: 'برمجة الواجهة الأمامية', completed: false },
      { id: 4, title: 'برمجة النظام الخلفي', completed: false },
      { id: 5, title: 'الاختبار والجودة', completed: false },
      { id: 6, title: 'التسليم النهائي', completed: false },
    ]
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(doc => ({ 
        id: doc.id, 
        name: String(doc.data().name || ''), 
        phone: String(doc.data().phone || '') 
      })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({
        name: '',
        clientId: '',
        clientName: '',
        requirements: '',
        status: 'قيد التنفيذ',
        images: [],
        progress: 0,
        steps: [
          { id: 1, title: 'تحليل المتطلبات', completed: false },
          { id: 2, title: 'تصميم الواجهات UI/UX', completed: false },
          { id: 3, title: 'برمجة الواجهة الأمامية', completed: false },
          { id: 4, title: 'برمجة النظام الخلفي', completed: false },
          { id: 5, title: 'الاختبار والجودة', completed: false },
          { id: 6, title: 'التسليم النهائي', completed: false },
        ]
      });
      setClientSearch('');
    }
  }, [initialData, isOpen]);

  const filteredClients = useMemo(() => {
    const s = clientSearch.toLowerCase().trim();
    if (!s) return clients;
    
    return clients.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(s);
      const phoneMatch = c.phone.includes(s);
      return nameMatch || phoneMatch;
    });
  }, [clients, clientSearch]);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.clientId) return;
    const selectedClient = clients.find(c => c.id === formData.clientId);
    await onSave({ ...formData, clientName: selectedClient?.name || '' });
    
    // تأكيد استجابة الشاشة بعد الحفظ
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Briefcase className="h-6 w-6" /> {initialData ? 'تعديل المشروع' : 'مشروع جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold">
              اربط المشروع بالعميل من خلال البحث بالاسم أو رقم الهاتف
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[75vh] p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700">اسم المشروع</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="مثال: تطبيق إي كومرس" 
                  className="rounded-2xl h-12 border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-slate-700">البحث عن العميل (اسم/هاتف)</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="اكتب رقم الهاتف أو الاسم..." 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="rounded-2xl h-12 pr-10 border-slate-200 font-bold text-sm bg-slate-50/50"
                    />
                  </div>
                  <Select value={formData.clientId} onValueChange={(val) => setFormData({...formData, clientId: val})}>
                    <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-bold">
                      <SelectValue placeholder="اختر من قائمة النتائج" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-bold max-h-[200px]">
                      {filteredClients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-sm">{c.name}</span>
                            <span className="text-[10px] text-primary font-black" dir="ltr">{c.phone}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400 italic">
                          لا يوجد عملاء مطابقين لهذا البحث
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-700">حالة التنفيذ</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl font-bold">
                  <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                  <SelectItem value="في انتظار المراجعة">في انتظار المراجعة</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                  <SelectItem value="متوقف مؤقتاً">متوقف مؤقتاً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-700">تفاصيل المشروع والمتطلبات</Label>
              <Textarea 
                value={formData.requirements} 
                onChange={(e) => setFormData({...formData, requirements: e.target.value})} 
                placeholder="اكتب هنا كافة تفاصيل المشروع والمميزات المطلوبة..."
                className="rounded-2xl min-h-[120px] border-slate-200 font-bold leading-relaxed"
              />
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <Label className="font-black flex items-center gap-2 text-slate-700">
                <ImageIcon className="h-4 w-4 text-primary" /> صور التطبيق (روابط الصور)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)} 
                  placeholder="أدخل رابط الصورة..." 
                  className="rounded-xl h-11 border-slate-200 bg-white"
                />
                <Button onClick={handleAddImage} className="rounded-xl h-11 px-4"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border bg-white">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {idx === 0 && <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg">الغلاف</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-slate-50 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name || !formData.clientId}
            className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-xl hover:scale-[1.01] transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
            {initialData ? 'تحديث بيانات المشروع' : 'بدء تنفيذ المشروع الآن'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
