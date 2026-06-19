'use client';

import * as React from 'react';
import { useState } from 'react';
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
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientData) => Promise<void>;
  isLoading: boolean;
}

export function AddClientModal({ isOpen, onClose, onSave, isLoading }: AddClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const handleSaveClick = async () => {
    await onSave({ name, email, phone, company });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل العميل الجديد هنا. انقر على حفظ عند الانتهاء.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">الاسم</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل الكامل" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@company.com" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">رقم الهاتف</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5..." className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">الشركة</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="اسم الشركة (اختياري)" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSaveClick} disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ العميل
          </Button> 
          <Button variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
