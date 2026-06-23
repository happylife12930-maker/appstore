'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Loader2, User, Mail, Phone, Building, Wallet, CreditCard, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ClientData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  company: string;
  projectName?: string;
  totalInvoices: number;
  totalPayments: number;
  balance: number;
  createdAt?: string;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientData) => Promise<void>;
  isLoading: boolean;
  initialData?: ClientData | null;
}

export function AddClientModal({ isOpen, onClose, onSave, isLoading, initialData }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phone2: '',
    company: '',
    projectName: '',
    totalInvoices: 0,
    totalPayments: 0
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        phone2: initialData.phone2 || '',
        company: initialData.company || '',
        projectName: initialData.projectName || '',
        totalInvoices: initialData.totalInvoices || 0,
        totalPayments: initialData.totalPayments || 0
      });
    } else if (isOpen) {
      setFormData({
        name: '', email: '', phone: '', phone2: '', company: '', projectName: '', totalInvoices: 0, totalPayments: 0
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id.includes('total') ? Number(value) : value
    }));
  };

  const handleSaveClick = () => {
    if (!formData.name) return;
    const dataForSave: Partial<ClientData> = {
      ...formData,
      balance: (formData.totalInvoices || 0) - (formData.totalPayments || 0),
    };
    if (initialData?.id) dataForSave.id = initialData.id;
    else dataForSave.createdAt = new Date().toISOString();
    onSave(dataForSave as ClientData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground shrink-0 shadow-md z-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              {initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold mt-1">
              أدخل البيانات المالية وأرقام التواصل بدقة لضمان صحة التقارير
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-black flex items-center gap-2 pr-1">
                  <User className="h-4 w-4 text-primary" /> الاسم الكامل للعميل
                </Label>
                <Input id="name" value={formData.name} onChange={handleChange} placeholder="مثال: أحمد محمد" className="rounded-2xl h-14 border-slate-200 font-bold text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName" className="font-black flex items-center gap-2 pr-1">
                  <Building className="h-4 w-4 text-primary" /> اسم المشروع الحالي
                </Label>
                <Input id="projectName" value={formData.projectName} onChange={handleChange} placeholder="مثال: تطبيق متجر إلكتروني" className="rounded-2xl h-14 border-slate-200 font-bold text-base" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-black flex items-center gap-2 pr-1">
                  <Phone className="h-4 w-4 text-primary" /> رقم الهاتف الأساسي
                </Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="012xxxxxxx" className="rounded-2xl h-14 border-slate-200 font-bold text-base" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2" className="font-black flex items-center gap-2 pr-1">
                  <Phone className="h-4 w-4 text-slate-400" /> رقم هاتف بديل (اختياري)
                </Label>
                <Input id="phone2" value={formData.phone2} onChange={handleChange} placeholder="010xxxxxxx" className="rounded-2xl h-14 border-slate-200 font-bold text-base" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black flex items-center gap-2 pr-1">
                  <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="example@mail.com" className="rounded-2xl h-14 border-slate-200 font-bold text-base" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="font-black flex items-center gap-2 pr-1">
                  <Building className="h-4 w-4 text-primary" /> الشركة / المؤسسة
                </Label>
                <Input id="company" value={formData.company} onChange={handleChange} placeholder="اسم الشركة (إن وجد)" className="rounded-2xl h-14 border-slate-200 font-bold text-base" />
              </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-3 pr-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Wallet className="h-5 w-5" /></div>
                <h3 className="font-black text-slate-800 text-lg">البيانات المالية والموقف المالي</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalInvoices" className="font-black text-slate-600">إجمالي قيمة التعاقد (ج.م)</Label>
                  <Input id="totalInvoices" type="number" value={formData.totalInvoices} onChange={handleChange} className="rounded-2xl h-14 border-slate-200 font-black text-xl bg-white shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalPayments" className="font-black text-green-600">المبالغ المسددة فعلياً (ج.م)</Label>
                  <Input id="totalPayments" type="number" value={formData.totalPayments} onChange={handleChange} className="rounded-2xl h-14 border-green-200 font-black text-xl text-green-700 bg-green-50/50 shadow-sm" />
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-white/40 p-4 rounded-3xl">
                <div className="flex flex-col">
                  <span className="font-black text-slate-400 text-xs uppercase tracking-wider">صافي الرصيد المتبقي</span>
                  <span className={`text-3xl font-black ${formData.totalInvoices - formData.totalPayments > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    {(formData.totalInvoices - formData.totalPayments).toLocaleString('ar-EG')} <small className="text-sm">ج.م</small>
                  </span>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${formData.totalInvoices - formData.totalPayments > 0 ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                   {formData.totalInvoices - formData.totalPayments > 0 ? <CreditCard className="h-6 w-6" /> : <X className="h-6 w-6 rotate-45" />}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-slate-50 border-t shrink-0 z-10">
          <Button type="submit" onClick={handleSaveClick} disabled={isLoading || !formData.name} className="rounded-2xl font-black h-16 px-10 text-xl shadow-2xl w-full hover:scale-[1.01] active:scale-95 transition-all">
            {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <CreditCard className="ml-2 h-6 w-6" />}
            {initialData ? 'تحديث بيانات العميل الآن' : 'تأكيد وإضافة العميل للنظام'}
          </Button> 
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
