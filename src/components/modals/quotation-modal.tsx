
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
import { Loader2, ImageIcon, Plus, Trash2, Save, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

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
    status: 'مكتمل'
  });

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
        status: 'مكتمل'
      });
    }
  }, [initialData, isOpen]);

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
      toast({ title: "تم الرفع", description: `تمت إضافة ${uploadedUrls.length} صور للمعرض.` });
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
      <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black flex items-center gap-3">
              <ImageIcon className="h-8 w-8" /> {initialData ? 'تعديل المعرض' : 'إضافة صور ومعرض جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold text-lg">
              ارفع الصور واكتب اسم العرض بشكل واضح
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[70vh] p-8">
          <div className="space-y-10">
            {/* صندوق الاسم - Box */}
            <div className="space-y-3">
              <Label className="font-black text-xl text-slate-800 pr-2">اسم العرض (سيظهر فوق الصور)</Label>
              <Input 
                value={formData.projectName} 
                onChange={(e) => setFormData({...formData, projectName: e.target.value})} 
                placeholder="مثال: تصميم تطبيق مطعم - عرض العميل" 
                className="rounded-2xl h-16 border-2 border-primary/20 font-black text-xl px-6 focus-visible:ring-primary shadow-sm"
              />
            </div>

            {/* رفع الصور - Gallery Upload */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-lg text-slate-800">تحميل الصور للمعرض</h3>
                  <p className="text-sm font-bold text-slate-400">يمكنك اختيار عدة صور معاً (PNG, JPG)</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="rounded-2xl h-12 px-8 font-black gap-2 shadow-lg"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  اختر الصور الآن
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-10 bg-slate-50 border-t">
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isLoading || isUploading || !formData.projectName}
            className="w-full h-20 rounded-[1.5rem] font-black text-2xl gap-3 shadow-2xl active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin h-8 w-8" /> : <Save className="h-8 w-8" />}
            {initialData ? 'حفظ التغييرات' : 'تأكيد وحفظ المعرض'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
