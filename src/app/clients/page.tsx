"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Home,
  PlusCircle,
  Loader2
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
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      await addDoc(collection(db, "clients"), {
        ...clientData,
        projects: 0,
        totalInvoices: 0,
        totalPayments: 0,
        balance: 0,
        startDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      toast({ title: "نجاح", description: "تمت إضافة العميل بنجاح." });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding client: ", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة العميل.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف العميل.", variant: "destructive" });
    }
  };

  return (
    <>
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient}
        isLoading={isSaving}
      />
      <div className="max-w-7xl mx-auto space-y-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/")} className="rounded-xl">
              <Home className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">إدارة العملاء</h1>
              <p className="text-muted-foreground font-medium">قائمة العملاء والتفاصيل المالية الخاصة بهم</p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl font-bold shadow-lg">
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة عميل جديد
          </Button>
        </header>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">قائمة العملاء</CardTitle>
            <CardDescription className="font-medium">{loading ? "جاري التحميل..." : `إجمالي ${clients.length} عملاء`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المشاريع</TableHead>
                  <TableHead className="text-right">إجمالي الفواتير</TableHead>
                  <TableHead className="text-right">المدفوعات</TableHead>
                  <TableHead className="text-right">الرصيد المتبقي</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-bold">{client.name}</div>
                        <div className="text-xs text-muted-foreground font-medium">{client.email}</div>
                      </TableCell>
                      <TableCell className="font-bold">{client.projects || 0}</TableCell>
                      <TableCell className="font-bold">{(client.totalInvoices || 0).toLocaleString('ar-SA')} ر.س</TableCell>
                      <TableCell className="font-bold">{(client.totalPayments || 0).toLocaleString('ar-SA')} ر.س</TableCell>
                      <TableCell>
                        <Badge variant={(client.balance || 0) === 0 ? "default" : "destructive"} className="rounded-lg">
                          {(client.balance || 0).toLocaleString('ar-SA')} ر.س
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" dir="rtl" className="font-medium">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem>تعديل العميل</DropdownMenuItem>
                            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-red-500">حذف العميل</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-muted-foreground">لم يتم إضافة أي عملاء بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}