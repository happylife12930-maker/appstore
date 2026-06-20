
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
import { Loader2, Calculator, Sparkles, Image as ImageIcon, Plus, Trash2, Save, User, Building, DollarSign, Clock, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateProjectQuotation } from '@/ai/flows/generate-project-quotation-flow';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: any | null;
}

export function QuotationModal({ isOpen, onClose, onSave, isLoading, initialData }: QuotationModalProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientRequestDescription: '',
    suggestedRequirements: [] as string[],
    estimatedCost: 0,
    executionTimelineDays: 0,
    notes: '',
    images: [] as string[],
    status: 'معلق'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({
        projectName: '',
        clientName: '',
        clientRequestDescription: '',
        suggestedRequirements: [],
        estimatedCost: 0,
        executionTimelineDays: 0,
        notes: '',
        images: [],
        status: 'معلق'
      });
    }
  }, [initialData, isOpen]);

  const handleGenerateAI = async () => {
    if (!formData.clientRequestDescription) {
      toast({ title: "تنبيه", description: "يرجى كتابة وصف لطلب العميل أولاً.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProjectQuotation({ 
        clientRequestDescription: formData.clientRequestDescription 
      });
      
      setFormData(prev => ({
        ...prev,
        suggestedRequirements: result.suggestedRequirements,
        estimatedCost: result.estimatedCost,
        executionTimelineDays: result.executionTimelineDays,
        notes: result.notes
      }));
      
      toast({ title: "تم التوليد", description: "تم إنشاء عرض سعر ذكي بناءً على الوصف." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل توليد عرض السعر بالذكاء الاصطناعي.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

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
        
        const result = await response.json();
        if (result.success) uploadedUrls.push(result.data.url);
      }
      
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast({ title: "تم الرفع", description: `تم رفع ${uploadedUrls.length} صور بنجاح.` });
    } catch (error) {
      toast({ title: "خطأ في الرفع", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Calculator className="h-6 w-6" /> {initialData ? 'تعديل عرض السعر' : 'إنشاء عرض سعر جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold">
              استخدم الذكاء الاصطناعي لتوليد متطلبات وتكلفة المشروع بدقة
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[75vh] p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2">اسم المشروع المتوقع</Label>
                <Input 
                  value={formData.projectName} 
                  onChange={(e) => setFormData({...formData, projectName: e.target.value})} 
                  placeholder="مثال: متجر إلكتروني للملابس" 
                  className="rounded-2xl h-12 border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2">اسم العميل المرتقب</Label>
                <Input 
                  value={formData.clientName} 
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
                  placeholder="اسم العميل أو الشركة" 
                  className="rounded-2xl h-12 border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> وصف طلب العميل (للذكاء الاصطناعي)
              </Label>
              <Textarea 
                value={formData.clientRequestDescription} 
                onChange={(e) => setFormData({...formData, clientRequestDescription: e.target.value})} 
                placeholder="اكتب هنا ما طلبه العميل بالضبط ليقوم النظام بتحليله..."
                className="rounded-2xl min-h-[120px] border-slate-200 font-bold leading-relaxed"
              />
              <Button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || !formData.clientRequestDescription}
                className="w-full h-14 rounded-2xl font-black bg-gradient-to-r from-primary to-accent text-white gap-2 shadow-xl hover:scale-[1.02] transition-all"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                توليد عرض السعر بالذكاء الاصطناعي
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> التكلفة التقديرية (ج.م)
                </Label>
                <Input 
                  type="number"
                  value={formData.estimatedCost} 
                  onChange={(e) => setFormData({...formData, estimatedCost: Number(e.target.value)})} 
                  className="rounded-2xl h-12 border-slate-200 font-black text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> مدة التنفيذ (أيام)
                </Label>
                <Input 
                  type="number"
                  value={formData.executionTimelineDays} 
                  onChange={(e) => setFormData({...formData, executionTimelineDays: Number(e.target.value)})} 
                  className="rounded-2xl h-12 border-slate-200 font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-black text-slate-700 pr-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> معرض الصور والأصول المبدئية
              </Label>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="w-full h-14 rounded-2xl border-dashed border-2 font-black gap-2 text-slate-500 hover:text-primary hover:border-primary transition-all"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  رفع صور للمعرض (تصاميم، مراجع، الخ)
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm group">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-700 pr-2">المتطلبات المقترحة</Label>
              <div className="space-y-2">
                {formData.suggestedRequirements.map((req, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input 
                      value={req} 
                      onChange={(e) => {
                        const newReqs = [...formData.suggestedRequirements];
                        newReqs[idx] = e.target.value;
                        setFormData({...formData, suggestedRequirements: newReqs});
                      }}
                      className="rounded-xl h-10 border-slate-100 font-bold"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, suggestedRequirements: formData.suggestedRequirements.filter((_, i) => i !== idx)})} className="text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFormData({...formData, suggestedRequirements: [...formData.suggestedRequirements, '']})} className="rounded-xl font-black gap-1 mt-2">
                  <Plus className="h-4 w-4" /> إضافة متطلب يدوياً
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-slate-50 border-t">
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isLoading || !formData.projectName}
            className="w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-2xl active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
            {initialData ? 'حفظ التعديلات' : 'تأكيد وحفظ عرض السعر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
