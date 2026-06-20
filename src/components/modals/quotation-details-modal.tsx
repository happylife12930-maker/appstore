
'use client';

import * as React from 'react';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Image as ImageIcon,
  DollarSign,
  Clock,
  FileText,
  ChevronLeft,
  Maximize2,
  ListChecks,
  Info,
  X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuotationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any | null;
}

export function QuotationDetailsModal({ isOpen, onClose, quotation }: QuotationDetailsModalProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!quotation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col" dir="rtl">
        <div className="bg-slate-900 p-8 text-white shrink-0 z-20 shadow-md">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-right">
                <div className="p-3 bg-primary rounded-2xl shadow-lg">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">{quotation.projectName}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold mt-1">
                    المستفيد: {quotation.clientName || 'غير محدد'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
                  <span className="text-[10px] font-black uppercase opacity-60 block">التكلفة</span>
                  <span className="text-sm font-black text-accent">{(quotation.estimatedCost || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
                  <span className="text-[10px] font-black uppercase opacity-60 block">المدة</span>
                  <span className="text-sm font-black">{quotation.executionTimelineDays} يوم</span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-8 bg-slate-50/30">
          <div className="space-y-10">
            {/* معرض الصور - Gallery */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-2 pr-2">
                <ImageIcon className="h-5 w-5 text-primary" /> معرض الصور والتصاميم المرفقة
              </h3>
              {quotation.images && quotation.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quotation.images.map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setFullscreenImage(img)}
                      className="group relative aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-sm hover:shadow-xl transition-all cursor-zoom-in bg-slate-100"
                    >
                      <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white h-8 w-8 drop-shadow-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed rounded-3xl text-center text-slate-400 font-bold bg-white">
                  لا توجد صور مرفقة بعرض السعر هذا.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2">
                    <ListChecks className="h-5 w-5 text-primary" /> المتطلبات المقترحة
                  </h3>
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-3 shadow-sm">
                    {quotation.suggestedRequirements?.map((req: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-50">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{req}</span>
                      </div>
                    ))}
                    {!quotation.suggestedRequirements?.length && <p className="text-slate-400 text-sm">لا توجد متطلبات مسجلة.</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2">
                    <Info className="h-5 w-5 text-primary" /> ملاحظات إضافية
                  </h3>
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm min-h-[150px]">
                    <p className="text-slate-600 font-bold leading-relaxed text-sm whitespace-pre-line italic">
                      {quotation.notes || 'لا توجد ملاحظات إضافية.'}
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-primary rounded-[2rem] text-primary-foreground relative overflow-hidden shadow-xl">
                  <Calculator className="absolute -bottom-6 -left-6 h-40 w-40 opacity-10 rotate-12" />
                  <div className="relative z-10 text-center">
                    <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">إجمالي التقدير المالي</p>
                    <h2 className="text-4xl font-black">{(quotation.estimatedCost || 0).toLocaleString('ar-EG')} <span className="text-lg">ج.م</span></h2>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onClose}
              className="w-full h-16 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all gap-2"
            >
              إغلاق العرض <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
        </ScrollArea>

        {/* عرض الصورة بكامل الشاشة - Fullscreen Lightbox */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full h-12 w-12"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="h-8 w-8" />
            </Button>
            <img 
              src={fullscreenImage} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
              alt="" 
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
