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
import { Loader2, User, Mail, Phone, Building, Wallet, CreditCard } from 'lucide-react';

export interface ClientData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  projectName?: string;
  totalInvoices: number;
  totalPayments: number;
  balance: number;
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
        company: initialData.company || '',
        projectName: initialData.projectName || '',
        totalInvoices: initialData.totalInvoices || 0,
        totalPayments: initialData.totalPayments || 0
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        projectName: '',
        totalInvoices: 0,
        totalPayments: 0
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

  const handleSaveClick = async () => {
    if (!formData.name) return;
    await onSave({ 
      ...formData,
      id: initialData?.id,
      balance: formData.totalInvoices - formData.totalPayments
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
        <div className="bg-primary p-8 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              {initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold text-base mt-2">
              يرجى إدخال تفاصيل العميل والبيانات المالية بدقة.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-right font-black flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> الاسم الكامل
              </Label>
              <Input id="name" value={formData.name} onChange={handleChange} placeholder="اسم العميل" className="rounded-2xl h-12 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-right font-black flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> اسم المشروع
              </Label>
              <Input id="projectName" value={formData.projectName} onChange={handleChange} placeholder="مشروع العميل الحالي" className="rounded-2xl h-12 border-slate-200 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right font-black flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
              </Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="example@mail.com" className="rounded-2xl h-12 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-right font-black flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> رقم الجوال
              </Label>
              <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="+966 5..." className="rounded-2xl h-12 border-slate-200 font-bold" />
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> البيانات المالية للتعاقد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalInvoices" className="text-right font-black flex items-center gap-2">
                   المبلغ الإجمالي (ر.س)
                </Label>
                <Input id="totalInvoices" type="number" value={formData.totalInvoices} onChange={handleChange} className="rounded-2xl h-12 border-slate-200 font-black text-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPayments" className="text-right font-black flex items-center gap-2 text-green-600">
                   المبلغ المدفوع (ر.س)
                </Label>
                <Input id="totalPayments" type="number" value={formData.totalPayments} onChange={handleChange} className="rounded-2xl h-12 border-green-200 font-black text-lg text-green-700 bg-green-50/30" />
              </div>
            </div>
            
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-black text-slate-500">الرصيد المتبقي:</span>
              <span className={`text-2xl font-black ${formData.totalInvoices - formData.totalPayments > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                {(formData.totalInvoices - formData.totalPayments).toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 gap-3 border-t">
          <Button type="submit" onClick={handleSaveClick} disabled={isLoading || !formData.name} className="rounded-2xl font-black h-14 px-10 text-lg shadow-xl w-full md:w-auto">
            {isLoading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <CreditCard className="ml-2 h-5 w-5" />}
            {initialData ? 'تحديث البيانات' : 'تأكيد وحفظ العميل'}
          </Button> 
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-2xl font-black h-14 px-8 text-lg w-full md:w-auto">
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
