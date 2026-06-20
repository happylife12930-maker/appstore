
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/select';
import { Loader2, Briefcase, Search, Image as ImageIcon, Plus, Trash2, Save, Phone, UserCheck, DollarSign, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface ProjectData {
  id?: string;
  name: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
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

const normalizeForSearch = (text: any) => {
  if (!text) return '';
  const str = String(text);
  const arToEn = (s: string) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

export function ProjectModal({ isOpen, onClose, onSave, isLoading, initialData }: ProjectModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    clientId: '',
    clientName: '',
    clientPhone: '',
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
        clientPhone: '',
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

  const filteredClients = useMemo(() => {
    const s = normalizeForSearch(clientSearch);
    if (!s) return clients;
    
    return clients.filter(c => {
      const nameMatch = normalizeForSearch(c.name).includes(s);
      const phoneMatch = normalizeForSearch(c.phone).includes(s);
      return nameMatch || phoneMatch;
    });
  }, [clients, clientSearch]);

  const selectedClientDisplay = useMemo(() => {
    const found = clients.find(c => c.id === formData.clientId);
    const searchNormalized = normalizeForSearch(clientSearch);
    
    if (searchNormalized && found && !normalizeForSearch(found.phone).includes(searchNormalized) && !normalizeForSearch(found.name).includes(searchNormalized)) {
      return `جاري البحث عن: ${clientSearch}... (اختر من الأسفل)`;
    }

    if (found) return `${found.name} (${found.phone})`;
    if (clientSearch) return `نتائج البحث عن: ${clientSearch}`;
    return "اختر العميل من القائمة...";
  }, [clients, formData.clientId, clientSearch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    const IMGBB_API_KEY = '182b7fc61cf92fcbd3094ed2dce7cd27';
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!response.ok) throw new Error('فشل الرفع لخدمة ImgBB');
        
        const result = await response.json();
        if (result.success && result.data && result.data.url) {
          uploadedUrls.push(result.data.url);
        }
      }
      
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast({ 
        title: "تم الرفع بنجاح", 
        description: `تم رفع ${uploadedUrls.length} صور ومعالجتها عبر ImgBB` 
      });
    } catch (error) {
      toast({ 
        title: "خطأ في الرفع", 
        description: "حدثت مشكلة أثناء محاولة رفع الصور، تأكد من الاتصال بالإنترنت", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.clientId) return;
    const selectedClient = clients.find(c => c.id === formData.clientId);
    await onSave({ 
      ...formData, 
      clientName: selectedClient?.name || '', 
      clientPhone: selectedClient?.phone || '' 
    });
    
    setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 500);
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
              اربط المشروع بالعميل وحدد التكلفة والواجهات
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
                  className="rounded-2xl h-12 border-slate-200 font-bold"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                   البحث عن العميل (اسم/هاتف) <Phone className="h-3 w-3 text-primary" />
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="اكتب رقم الهاتف هنا..." 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="rounded-2xl h-12 pr-10 border-slate-200 font-bold text-sm bg-slate-50/50"
                    />
                  </div>
                  
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(val) => {
                      setFormData({...formData, clientId: val});
                      setClientSearch('');
                    }}
                  >
                    <SelectTrigger className="rounded-2xl h-12 border-slate-200 font-black text-right bg-white shadow-sm">
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
                  className="rounded-2xl h-12 border-slate-200 font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-700 pr-2">تفاصيل المتطلبات</Label>
              <Textarea 
                value={formData.requirements} 
                onChange={(e) => setFormData({...formData, requirements: e.target.value})} 
                placeholder="صف هنا مميزات التطبيق والمتطلبات التقنية بالتفصيل..."
                className="rounded-2xl min-h-[140px] border-input font-bold leading-relaxed"
              />
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <div className="flex items-center justify-between pr-2">
                <Label className="font-black flex items-center gap-2 text-slate-700">
                  <ImageIcon className="h-4 w-4 text-primary" /> صور وواجهات المشروع
                </Label>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    multiple
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-2xl font-black h-14 px-10 gap-2 border-primary text-primary hover:bg-primary/5 shadow-sm transition-all active:scale-95"
                  >
                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    رفع صور من الجهاز (اختيار متعدد)
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-3 text-primary font-black text-sm p-4 bg-white/50 rounded-2xl animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin" /> جاري رفع ومعالجة الصور عبر ImgBB...
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && !isUploading && (
                  <div className="col-span-full py-10 text-center opacity-40 flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-[2rem]">
                    <ImageIcon className="h-10 w-10" />
                    <p className="font-bold">لا توجد صور مرفوعة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-slate-50 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isUploading || !formData.name || !formData.clientId}
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
