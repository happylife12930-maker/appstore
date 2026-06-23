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
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Wallet, 
  CreditCard, 
  X, 
  Plus, 
  Calendar, 
  Trash2, 
  Banknote,
  DollarSign,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface Installment {
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
}

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
  paymentType: 'cash' | 'installments';
  installments?: Installment[];
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
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<ClientData>>({
    name: '',
    email: '',
    phone: '',
    phone2: '',
    company: '',
    projectName: '',
    totalInvoices: 0,
    totalPayments: 0,
    paymentType: 'cash',
    installments: []
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        ...initialData,
        paymentType: initialData.paymentType || 'cash',
        installments: initialData.installments || []
      });
    } else if (isOpen) {
      setFormData({
        name: '', email: '', phone: '', phone2: '', company: '', projectName: '', 
        totalInvoices: 0, totalPayments: 0, paymentType: 'cash', installments: []
      });
    }
  }, [initialData, isOpen]);

  // منطق الحساب المطور: الرصيد هو إجمالي الفواتير ناقص ما تم سداده فعلياً
  const currentBalance = (formData.totalInvoices || 0) - (formData.totalPayments || 0);
  
  // نجمع فقط مبالغ الأقساط "المعلقة" للتحقق من عدم تجاوز الرصيد
  const pendingInstallmentsAmount = formData.installments?.reduce((acc, inst) => {
    return inst.status === 'pending' ? acc + (inst.amount || 0) : acc;
  }, 0) || 0;

  // التحقق من تجاوز الرصيد المتبقي
  const isExceeded = formData.paymentType === 'installments' && pendingInstallmentsAmount > currentBalance;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id.includes('total') ? Number(value) : value
    }));
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...(prev.installments || []), { amount: 0, dueDate: '', status: 'pending' }]
    }));
  };

  const removeInstallment = (index: number) => {
    // منع حذف قسط تم سداده
    if (formData.installments?.[index]?.status === 'paid') {
      toast({ title: "حماية البيانات", description: "لا يمكن حذف قسط تم سداده فعلياً.", variant: "destructive" });
      return;
    }
    setFormData(prev => ({
      ...prev,
      installments: prev.installments?.filter((_, i) => i !== index)
    }));
  };

  const handleInstallmentChange = (index: number, field: keyof Installment, value: any) => {
    const newInstallments = [...(formData.installments || [])];
    const oldInstallment = newInstallments[index];
    
    // منع تعديل بيانات قسط مسدد إلا لو كنا بنغير الحالة
    if (oldInstallment.status === 'paid' && field !== 'status') return;

    if (field === 'status') {
      const amount = oldInstallment.amount || 0;
      let newTotalPayments = formData.totalPayments || 0;
      
      if (value === 'paid' && oldInstallment.status === 'pending') {
        newTotalPayments += amount;
      } else if (value === 'pending' && oldInstallment.status === 'paid') {
        newTotalPayments -= amount;
      }
      
      setFormData(prev => ({ ...prev, totalPayments: newTotalPayments }));
    }

    newInstallments[index] = { ...newInstallments[index], [field]: field === 'amount' ? Number(value) : value };
    setFormData(prev => ({ ...prev, installments: newInstallments }));
  };

  const handleSaveClick = () => {
    if (!formData.name) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال اسم العميل على الأقل", variant: "destructive" });
      return;
    }

    if (isExceeded) {
      toast({ 
        title: "خطأ في الحسابات", 
        description: "إجمالي الأقساط المعلقة أكبر من الرصيد المتبقي!", 
        variant: "destructive" 
      });
      return;
    }

    const dataForSave: ClientData = {
      ...(formData as ClientData),
      balance: (formData.totalInvoices || 0) - (formData.totalPayments || 0),
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSave(dataForSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col" dir="rtl">
        <div className="bg-primary p-6 text-primary-foreground shrink-0 shadow-md z-20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              {initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold mt-1">
              إدارة البيانات الشخصية ونظام الأقساط المحمي
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-[#fcfcfc]">
          <div className="space-y-6">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 border-r-4 border-primary pr-3">بيانات التواصل والشركة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-black text-xs text-slate-500 pr-1">اسم العميل بالكامل</Label>
                <Input id="name" value={formData.name} onChange={handleChange} placeholder="أدخل اسم العميل..." className="rounded-2xl h-12 border-slate-200 font-bold bg-white shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName" className="font-black text-xs text-slate-500 pr-1">اسم المشروع</Label>
                <Input id="projectName" value={formData.projectName} onChange={handleChange} placeholder="مثال: تطبيق توصيل" className="rounded-2xl h-12 border-slate-200 font-bold bg-white shadow-sm" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-black text-xs text-slate-500 pr-1 flex items-center gap-1">رقم الهاتف (1) <Badge variant="outline" className="text-[8px] h-3 px-1">أساسي</Badge></Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} className="rounded-2xl h-12 border-slate-200 font-bold bg-white shadow-sm" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2" className="font-black text-xs text-slate-500 pr-1 flex items-center gap-1">رقم الهاتف (2) <Badge variant="ghost" className="text-[8px] h-3 px-1 opacity-50">إضافي</Badge></Label>
                <Input id="phone2" value={formData.phone2} onChange={handleChange} placeholder="اختياري..." className="rounded-2xl h-12 border-slate-200 font-bold bg-white shadow-sm" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black text-xs text-slate-500 pr-1">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} className="rounded-2xl h-12 border-slate-200 font-bold bg-white shadow-sm" dir="ltr" />
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-black text-slate-800 text-lg">الموقف المالي</h3>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">صافي المتبقي:</span>
                <span className={`text-xl font-black ${currentBalance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {currentBalance.toLocaleString('ar-EG')} <small className="text-[10px]">ج.م</small>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="totalInvoices" className="font-black text-xs text-slate-600">إجمالي التعاقد</Label>
                <Input id="totalInvoices" type="number" value={formData.totalInvoices} onChange={handleChange} className="rounded-2xl h-14 border-slate-200 font-black text-xl text-center shadow-sm bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPayments" className="font-black text-xs text-green-600">إجمالي المحصل</Label>
                <Input id="totalPayments" type="number" value={formData.totalPayments} onChange={handleChange} className="rounded-2xl h-14 border-green-200 font-black text-xl text-center text-green-700 bg-green-50/50 shadow-sm" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <Label className="font-black text-slate-700 text-sm">نظام السداد</Label>
              <RadioGroup 
                value={formData.paymentType} 
                onValueChange={(val) => setFormData({...formData, paymentType: val as any})}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className={`flex items-center space-x-2 space-x-reverse flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentType === 'cash' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-100'}`} onClick={() => setFormData({...formData, paymentType: 'cash'})}>
                  <RadioGroupItem value="cash" id="cash" className="hidden" />
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${formData.paymentType === 'cash' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Banknote className="h-4 w-4" />
                  </div>
                  <Label htmlFor="cash" className="font-black text-sm cursor-pointer">سداد كاش</Label>
                </div>

                <div className={`flex items-center space-x-2 space-x-reverse flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentType === 'installments' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-slate-100'}`} onClick={() => setFormData({...formData, paymentType: 'installments'})}>
                  <RadioGroupItem value="installments" id="installments" className="hidden" />
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${formData.paymentType === 'installments' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Label htmlFor="installments" className="font-black text-sm cursor-pointer">سداد أقساط</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.paymentType === 'installments' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
                      جدولة الأقساط
                      <Badge variant="outline" className="rounded-lg h-5 px-1.5 font-bold bg-white">{formData.installments?.length || 0}</Badge>
                    </h4>
                    <p className={`text-[9px] font-bold ${isExceeded ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                      {isExceeded 
                        ? '⚠️ إجمالي الأقساط المعلقة يتجاوز الرصيد المتبقي!' 
                        : `إجمالي الأقساط المعلقة: ${pendingInstallmentsAmount.toLocaleString('ar-EG')} ج.م`}
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addInstallment} 
                    variant="outline" 
                    size="sm" 
                    disabled={pendingInstallmentsAmount >= currentBalance && currentBalance > 0}
                    className="rounded-xl font-black gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 h-9"
                  >
                    <Plus className="h-4 w-4" /> إضافة قسط
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.installments?.map((inst, idx) => (
                    <div key={idx} className={cn(
                      "bg-white p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row gap-4 items-end sm:items-center transition-all",
                      (isExceeded && inst.status === 'pending') ? 'border-rose-200' : 'border-slate-100',
                      inst.status === 'paid' ? 'bg-green-50/50 border-green-200' : ''
                    )}>
                      <div className="flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleInstallmentChange(idx, 'status', inst.status === 'paid' ? 'pending' : 'paid')}
                          className={cn(
                            "h-11 px-4 rounded-xl font-black text-[10px] gap-2 transition-all shadow-sm",
                            inst.status === 'paid' 
                              ? "bg-green-500 text-white border-green-600" 
                              : "bg-white text-orange-600 border-orange-200"
                          )}
                        >
                          {inst.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {inst.status === 'paid' ? 'تم السداد' : 'قيد الانتظار'}
                        </Button>
                      </div>

                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px] font-black text-slate-400 uppercase pr-1">المبلغ</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            value={inst.amount} 
                            disabled={inst.status === 'paid'}
                            onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                            className={cn(
                              "rounded-xl h-11 pr-8 font-black border-slate-100 bg-white",
                              inst.status === 'paid' && "bg-slate-50 text-slate-400 border-dashed cursor-not-allowed"
                            )} 
                            placeholder="0.00"
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                        <Label className="text-[10px] font-black text-slate-400 uppercase pr-1">تاريخ الاستحقاق</Label>
                        <Input 
                          type="date" 
                          value={inst.dueDate} 
                          disabled={inst.status === 'paid'}
                          onChange={(e) => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                          className={cn(
                            "rounded-xl h-11 font-bold border-slate-100 bg-white",
                            inst.status === 'paid' && "bg-slate-50 text-slate-400 border-dashed cursor-not-allowed"
                          )} 
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={inst.status === 'paid'}
                        onClick={() => removeInstallment(idx)}
                        className={cn(
                          "h-11 w-11 rounded-xl text-rose-300 hover:text-rose-50 transition-colors",
                          inst.status === 'paid' && "opacity-20 cursor-not-allowed"
                        )}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-4" />
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Button 
            type="submit" 
            onClick={handleSaveClick} 
            disabled={isLoading || !formData.name || isExceeded} 
            className={cn(
              "rounded-[1.5rem] font-black h-16 px-10 text-xl shadow-2xl w-full transition-all gap-3",
              isExceeded ? 'bg-slate-300' : 'bg-primary'
            )}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="h-6 w-6" />}
            {initialData ? 'تحديث بيانات العميل' : 'إضافة العميل'}
          </Button> 
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
