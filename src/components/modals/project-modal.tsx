
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
import { Loader2, Briefcase, Search, Image as ImageIcon, Plus, Trash2, Save, Phone, UserCheck, DollarSign } from 'lucide-react';
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
  cost: number;
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

// دالة تنظيف النص والبحث المتقدم للأرقام والأسماء
const normalizeForSearch = (text: any) => {
  if (!text) return '';
  const str = String(text);
  // تحويل الأرقام العربية إلى إنجليزية
  const arToEn = (s: string) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  // إزالة كافة الرموز والمسافات وترك الأرقام والحروف فقط لضمان دقة المقارنة
  return arToEn(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

export function ProjectModal({ isOpen, onClose, onSave, isLoading, initialData }: ProjectModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    clientId: '',
    clientName: '',
    requirements: '',
    status: 'قيد التنفيذ',
    cost: 0,
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
      setClientSearch('');
    } else if (isOpen) {
      setFormData({
        name: '',
        clientId: '',
        clientName: '',
        requirements: '',
        status: 'قيد التنفيذ',
        cost: 0,
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

  // فلترة العملاء بناءً على البحث
  const filteredClients = useMemo(() => {
    const s = normalizeForSearch(clientSearch);
    if (!s) return clients;
    
    return clients.filter(c => {
      const nameMatch = normalizeForSearch(c.name).includes(s);
      const phoneMatch = normalizeForSearch(c.phone).includes(s);
      return nameMatch || phoneMatch;
    });
  }, [clients, clientSearch]);

  // تحديث نص الزر ليعكس حالة البحث الحالية
  const selectedClientDisplay = useMemo(() => {
    const found = clients.find(c => c.id === formData.clientId);
    const searchNormalized = normalizeForSearch(clientSearch);
    
    // إذا كان المستخدم يكتب رقماً جديداً يختلف عن رقم العميل الحالي
    if (searchNormalized && found && !normalizeForSearch(found.phone).includes(searchNormalized) && !normalizeForSearch(found.name).includes(searchNormalized)) {
      return `جاري البحث عن: ${clientSearch}... (اختر من الأسفل)`;
    }

    if (found) return `${found.name} (${found.phone})`;
    if (clientSearch) return `نتائج البحث عن: ${clientSearch}`;
    return "اختر العميل من القائمة...";
  }, [clients, formData.clientId, clientSearch]);

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
    
    // ضمان عودة التفاعل للصفحة
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
              <Briefcase className="h-6 w-6" /> {initialData ? 'تعديل بيانات المشروع' : 'بدء مشروع جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold">
              ابحث عن العميل بالاسم أو رقم الهاتف لربطه بالمشروع فوراً
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[75vh] p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2">اسم المشروع</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="مثال: تطبيق توصيل طلبات" 
                  className="rounded-2xl h-12 border-slate-200 font-bold focus-visible:ring-primary/20"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                   ربط العميل (بحث بالاسم/الهاتف) <Phone className="h-3 w-3 text-primary" />
                </Label>
                <div className="space-y-2 group">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="اكتب رقم الهاتف هنا..." 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="rounded-2xl h-12 pr-10 border-slate-200 font-bold text-sm bg-slate-50/50 focus-visible:ring-primary shadow-inner"
                    />
                  </div>
                  
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(val) => {
                      setFormData({...formData, clientId: val});
                      // مسح البحث بعد الاختيار لتسهيل العرض
                      setClientSearch('');
                    }}
                  >
                    <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-black text-right bg-white shadow-sm hover:border-primary transition-all">
                      <div className="flex items-center gap-2">
                        {formData.clientId && <UserCheck className="h-4 w-4 text-green-500" />}
                        <span className="truncate">{selectedClientDisplay}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-bold max-h-[300px]">
                      {filteredClients.map(c => (
                        <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-primary/5">
                          <div className="flex flex-col items-start gap-0.5 text-right w-full py-1">
                            <span className="text-sm font-black text-slate-800">{c.name}</span>
                            <span className="text-[10px] text-primary font-black" dir="ltr">{c.phone}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="p-8 text-center text-xs text-slate-400 font-bold italic flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-20" />
                          لا يوجد عملاء بهذا الاسم أو الرقم
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2">حالة المشروع</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-black">
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
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> التكلفة المتفق عليها (ج.م)
                </Label>
                <Input 
                  type="number"
                  value={formData.cost} 
                  onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})} 
                  placeholder="0.00" 
                  className="rounded-2xl h-12 border-slate-200 font-black text-lg focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-700 pr-2">تفاصيل المتطلبات</Label>
              <Textarea 
                value={formData.requirements} 
                onChange={(e) => setFormData({...formData, requirements: e.target.value})} 
                placeholder="صف هنا مميزات التطبيق والمتطلبات التقنية بالتفصيل..."
                className="rounded-2xl min-h-[140px] border-slate-200 font-bold leading-relaxed focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <Label className="font-black flex items-center gap-2 text-slate-700 pr-2">
                <ImageIcon className="h-4 w-4 text-primary" /> صور وواجهات المشروع
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)} 
                  placeholder="ضع رابط الصورة هنا..." 
                  className="rounded-xl h-12 border-slate-200 bg-white"
                />
                <Button onClick={handleAddImage} className="rounded-xl h-12 px-6 shadow-md"><Plus className="h-5 w-5" /></Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                    {idx === 0 && <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm">الغلاف</div>}
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
            className="w-full h-16 rounded-[1.5rem] font-black text-xl gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
            {initialData ? 'تحديث بيانات المشروع' : 'بدء تنفيذ المشروع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
