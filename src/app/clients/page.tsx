"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Home,
  PlusCircle,
  Loader2,
  Edit,
  Trash2,
  ExternalLink
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

  const handleSaveClient = async (clientData: ClientData) => {
    setIsSaving(true);
    try {
      if (clientData.id) {
        // Update existing client
        const clientRef = doc(db, "clients", clientData.id);
        const { id, ...dataToUpdate } = clientData;
        await updateDoc(clientRef, {
          ...dataToUpdate,
          updatedAt: serverTimestamp()
        });
        toast({ title: "تم التحديث", description: "تم تحديث بيانات العميل بنجاح." });
      } else {
        // Add new client
        await addDoc(collection(db, "clients"), {
          ...clientData,
          projects: 1, // Start with one project
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        toast({ title: "نجاح", description: "تمت إضافة العميل بنجاح." });
      }
      setIsModalOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Error saving client: ", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حفظ البيانات.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف العميل.", variant: "destructive" });
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }} 
        onSave={handleSaveClient}
        isLoading={isSaving}
        initialData={selectedClient}
      />
      <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl hover:bg-primary hover:text-white transition-colors">
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">إدارة العملاء</h1>
              <p className="text-muted-foreground font-medium">قائمة العملاء والتفاصيل المالية الشاملة</p>
            </div>
          </div>
          <Button onClick={openAddModal} className="rounded-xl font-bold shadow-lg h-12 px-6 text-lg">
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة عميل جديد
          </Button>
        </header>

        <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xl font-bold text-slate-800">سجل العملاء المالي</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              {loading ? "جاري مزامنة البيانات..." : `يوجد حالياً ${clients.length} عملاء مسجلين`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-black text-slate-900 py-6">العميل والمشروع</TableHead>
                  <TableHead className="text-right font-black text-slate-900">المبلغ الكلي</TableHead>
                  <TableHead className="text-right font-black text-slate-900">المدفوع</TableHead>
                  <TableHead className="text-right font-black text-slate-900">المتبقي</TableHead>
                  <TableHead className="text-center font-black text-slate-900">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-4">
                        <div className="font-black text-slate-900 text-lg">{client.name}</div>
                        <div className="text-sm text-primary font-bold">{client.projectName || "بدون مشروع"}</div>
                        <div className="text-xs text-slate-400 font-medium">{client.email}</div>
                      </TableCell>
                      <TableCell className="font-black text-slate-700 text-base">
                        {(client.totalInvoices || 0).toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell className="font-black text-green-600 text-base">
                        {(client.totalPayments || 0).toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge variant={(client.balance || 0) === 0 ? "default" : "destructive"} className="rounded-xl px-4 py-1 text-sm font-black shadow-sm">
                          {(client.balance || 0).toLocaleString('ar-SA')} ر.س
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" dir="rtl" className="font-bold rounded-2xl p-2 shadow-2xl border-none">
                            <DropdownMenuLabel className="text-slate-400 text-xs px-2">إدارة البيانات</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClient(client)} className="rounded-xl cursor-pointer py-3 gap-3">
                              <Edit className="h-4 w-4 text-blue-500" /> تعديل البيانات
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl cursor-pointer py-3 gap-3">
                              <ExternalLink className="h-4 w-4 text-slate-500" /> عرض السجل المالي
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="rounded-xl cursor-pointer py-3 gap-3 text-red-600 focus:bg-red-50 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /> حذف العميل نهائياً
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32">
                      <div className="space-y-4">
                        <p className="text-2xl font-bold text-slate-300">لا يوجد عملاء حالياً</p>
                        <Button onClick={openAddModal} variant="outline" className="rounded-xl font-bold">إضافة أول عميل</Button>
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
