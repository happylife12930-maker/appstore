
"use client";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  MoreHorizontal,
  Home,
  PlusCircle,
  Loader2,
  Edit,
  Trash2,
  ExternalLink,
  Building2,
  Mail,
  Users
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AddClientModal, ClientData } from "@/components/modals/add-client-modal";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // دالة لجلب البيانات
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients: ", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات العملاء.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // دالة وقائية لضمان عودة التفاعل مع الصفحة
  const forceEnableScroll = useCallback(() => {
    document.body.style.pointerEvents = 'auto';
    document.body.style.overflow = 'auto';
  }, []);

  const handleSaveClient = async (clientData: ClientData) => {
    setIsSaving(true);
    try {
      const balance = Number(clientData.totalInvoices || 0) - Number(clientData.totalPayments || 0);
      
      if (clientData.id) {
        const clientRef = doc(db, "clients", clientData.id);
        const { id, ...dataToUpdate } = clientData;
        await updateDoc(clientRef, {
          ...dataToUpdate,
          balance: balance,
          updatedAt: serverTimestamp()
        });
        toast({ title: "تم التحديث", description: "تم تحديث بيانات العميل بنجاح." });
      } else {
        await addDoc(collection(db, "clients"), {
          ...clientData,
          balance: balance,
          projects: 1,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        toast({ title: "نجاح", description: "تمت إضافة العميل بنجاح." });
      }
      
      // إغلاق النافذة وتصفير الحالة
      setIsModalOpen(false);
      setSelectedClient(null);
      // التأكد من عودة التفاعل
      setTimeout(forceEnableScroll, 100);
    } catch (error) {
      console.error("Error saving client: ", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ البيانات.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClient = (client: any) => {
    // نستخدم setTimeout للسماح للقائمة المنسدلة بالإغلاق أولاً قبل فتح النافذة
    setSelectedClient(client);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 100);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح." });
      setTimeout(forceEnableScroll, 100);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف العميل.", variant: "destructive" });
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setTimeout(forceEnableScroll, 100);
  };

  return (
    <>
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleSaveClient}
        isLoading={isSaving}
        initialData={selectedClient}
      />
      <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl hover:bg-primary hover:text-white transition-colors h-12 w-12">
              <Home className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">إدارة العملاء</h1>
              <p className="text-muted-foreground font-medium">قائمة العملاء والتفاصيل المالية الشاملة (ج.م)</p>
            </div>
          </div>
          <Button onClick={openAddModal} className="rounded-xl font-black shadow-lg h-14 px-8 text-lg w-full md:w-auto">
            <PlusCircle className="ml-2 h-6 w-6" />
            إضافة عميل جديد
          </Button>
        </header>

        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-black text-slate-800">سجل العملاء المالي</CardTitle>
                <CardDescription className="font-bold text-slate-500 mt-1">
                  {loading ? "جاري مزامنة البيانات..." : `يوجد حالياً ${clients.length} عملاء مسجلين`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-black text-slate-900 py-6 text-base">العميل والمشروع</TableHead>
                  <TableHead className="text-right font-black text-slate-900 text-base">المبلغ الكلي</TableHead>
                  <TableHead className="text-right font-black text-slate-900 text-base">المدفوع</TableHead>
                  <TableHead className="text-right font-black text-slate-900 text-base">المتبقي</TableHead>
                  <TableHead className="text-center font-black text-slate-900 text-base">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : clients.length > 0 ? (
                  clients.map((client) => {
                    const balance = Number(client.totalInvoices || 0) - Number(client.totalPayments || 0);
                    return (
                      <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors border-b">
                        <TableCell className="py-6">
                          <div className="font-black text-slate-900 text-lg mb-1">{client.name}</div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-primary font-black text-sm">
                              <Building2 className="h-3 w-3" />
                              {client.projectName || "بدون مشروع"}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-slate-700 text-base">
                          {(client.totalInvoices || 0).toLocaleString('ar-EG')} ج.م
                        </TableCell>
                        <TableCell className="font-black text-green-600 text-base">
                          {(client.totalPayments || 0).toLocaleString('ar-EG')} ج.م
                        </TableCell>
                        <TableCell>
                          <Badge variant={balance <= 0 ? "default" : "destructive"} className="rounded-xl px-4 py-2 text-sm font-black shadow-sm min-w-[100px] justify-center">
                            {balance.toLocaleString('ar-EG')} ج.م
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu onOpenChange={(open) => !open && forceEnableScroll()}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
                                <MoreHorizontal className="h-6 w-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl" className="font-black rounded-2xl p-2 shadow-2xl border-none min-w-[180px]">
                              <DropdownMenuLabel className="text-slate-400 text-xs px-2 mb-1">إدارة بيانات العميل</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleEditClient(client)} className="rounded-xl cursor-pointer py-3 gap-3 hover:bg-blue-50">
                                <Edit className="h-5 w-5 text-blue-500" /> تعديل البيانات المالية
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl cursor-pointer py-3 gap-3 hover:bg-slate-50">
                                <ExternalLink className="h-5 w-5 text-slate-500" /> كشف حساب تفصيلي
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteClient(client.id)} className="rounded-xl cursor-pointer py-3 gap-3 text-red-600 focus:bg-red-50 focus:text-red-600">
                                <Trash2 className="h-5 w-5" /> حذف السجل نهائياً
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32">
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="p-6 bg-slate-50 rounded-full">
                           <Users className="h-16 w-16 text-slate-200" />
                        </div>
                        <p className="text-2xl font-black text-slate-300">لا يوجد عملاء حالياً</p>
                        <Button onClick={openAddModal} variant="outline" className="rounded-xl font-black h-12 px-6">إضافة أول عميل للنظام</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
