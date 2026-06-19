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
import { Loader2 } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [totalPayments, setTotalPayments] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setCompany(initialData.company || '');
      setProjectName(initialData.projectName || '');
      setTotalInvoices(initialData.totalInvoices || 0);
      setTotalPayments(initialData.totalPayments || 0);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setProjectName('');
      setTotalInvoices(0);
      setTotalPayments(0);
    }
  }, [initialData, isOpen]);

  const handleSaveClick = async () => {
    await onSave({ 
      id: initialData?.id,
      name, 
      email, 
      phone, 
      company, 
      projectName,
      totalInvoices: Number(totalInvoices),
      totalPayments: Number(totalPayments),
      balance: Number(totalInvoices) - Number(totalPayments)
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
          <DialogDescription className="font-medium">
            أدخل تفاصيل العميل والبيانات المالية هنا.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-bold">الاسم</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل الكامل" className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectName" className="text-right font-bold">المشروع</Label>
            <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="اسم المشروع الحالي" className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right font-bold">الإيميل</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@company.com" className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right font-bold">الهاتف</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5..." className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalInvoices" className="text-right font-bold">المبلغ الكلي</Label>
            <Input id="totalInvoices" type="number" value={totalInvoices} onChange={(e) => setTotalInvoices(Number(e.target.value))} className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalPayments" className="text-right font-bold">المدفوع</Label>
            <Input id="totalPayments" type="number" value={totalPayments} onChange={(e) => setTotalPayments(Number(e.target.value))} className="col-span-3 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">المتبقي</Label>
            <div className="col-span-3 p-2 bg-slate-100 rounded-xl font-black text-primary">
              {(totalInvoices - totalPayments).toLocaleString('ar-SA')} ر.س
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="submit" onClick={handleSaveClick} disabled={isLoading} className="rounded-xl font-bold px-8">
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {initialData ? 'تحديث البيانات' : 'حفظ العميل'}
          </Button> 
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl font-bold">إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
