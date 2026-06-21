
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3, 
  Wallet,
  Loader2,
  Briefcase,
  ExternalLink,
  X,
  Printer,
  FileText,
  MessageCircle,
  Send,
  Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc, setDoc, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { AddClientModal, type ClientData } from "@/components/modals/add-client-modal";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";

// دالة توحيد النص للبحث
const normalizeText = (text: string) => {
  if (!text) return '';
  const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return arToEn(text).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

function ClientsContent() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quick Message State
  const [messageClient, setMessageClient] = useState<ClientData | null>(null);
  const [quickMessage, setQuickMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const { toast } = useToast();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (!db) return;
    
    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientData)));
      setLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, "projects"), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubClients(); unsubProjects(); };
  }, []);

  const clientsWithProjects = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id || p.clientPhone === client.phone);
      return {
        ...client,
        associatedProjects: clientProjects
      };
    });
  }, [clients, projects]);

  const filteredClients = useMemo(() => {
    const s = normalizeText(searchQuery);
    if (!s) return clientsWithProjects;

    return clientsWithProjects.filter(c => {
      const nameMatch = normalizeText(c.name).includes(s);
      const phoneMatch = normalizeText(c.phone).includes(s);
      const companyMatch = normalizeText(c.company || "").includes(s);
      const projectMatch = c.associatedProjects.some(p => 
        normalizeText(p.name || "").includes(s)
      );
      
      return nameMatch || phoneMatch || companyMatch || projectMatch;
    });
  }, [clientsWithProjects, searchQuery]);

  const handleSaveClient = async (data: ClientData) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (data.id) {
        await setDoc(doc(db, "clients", data.id), data);
        toast({ title: "تم التحديث", description: "تم تعديل بيانات العميل بنجاح" });
      } else {
        await addDoc(collection(db, "clients"), data);
        toast({ title: "تمت الإضافة", description: "تمت إضافة العميل الجديد بنجاح" });
      }
      setIsModalOpen(false);
      setEditingClient(null);
      setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 300);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast({ title: "تم الحذف", description: "تمت إزالة العميل من النظام" });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleSendQuickMessage = async () => {
    if (!db || !messageClient || !quickMessage.trim() || !profile) return;
    setIsSendingMsg(true);
    try {
      const threadId = messageClient.id;
      const msgText = quickMessage.trim();

      await addDoc(collection(db, "support_threads", threadId!, "messages"), {
        text: msgText,
        senderId: profile.uid,
        senderRole: 'admin',
        timestamp: serverTimestamp()
      });

      await setDoc(doc(db, "support_threads", threadId!), {
        clientId: threadId,
        clientName: messageClient.name,
        clientPhone: messageClient.phone,
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        unreadClient: increment(1)
      }, { merge: true });

      toast({ title: "تم الإرسال", description: "تم إرسال رسالتك لقسم الدعم الفني بنجاح." });
      setMessageClient(null);
      setQuickMessage("");
    } catch (err) {
      toast({ title: "خطأ", description: "فشل إرسال الرسالة السريعة", variant: "destructive" });
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handlePrintStatement = (client: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const projectsList = client.associatedProjects.map((p: any) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${p.status}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${(p.cost || 0).toLocaleString('ar-EG')} ج.م</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف حساب - ${client.name}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 40px; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1e293b; color: white; padding: 12px; text-align: right; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #eee; pt: 20px; }
            .balance-box { background: #1e293b; color: white; padding: 20px; border-radius: 15px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #1e293b;">APP STORE</h1>
            <p style="margin: 5px 0; font-weight: bold;">كشف حساب عميل رسمي</p>
            <p style="font-size: 12px;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          
          <div class="info-grid">
            <div class="card">
              <h3 style="margin-top: 0;">بيانات العميل</h3>
              <p><b>الاسم:</b> ${client.name}</p>
              <p><b>الهاتف:</b> ${client.phone}</p>
              <p><b>البريد:</b> ${client.email || '---'}</p>
              <p><b>الشركة:</b> ${client.company || '---'}</p>
            </div>
            <div class="card">
              <h3 style="margin-top: 0;">الملخص المالي</h3>
              <p><b>إجمالي التعاقدات:</b> ${(client.totalInvoices || 0).toLocaleString('ar-EG')} ج.م</p>
              <p><b>إجمالي المدفوعات:</b> ${(client.totalPayments || 0).toLocaleString('ar-EG')} ج.م</p>
              <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <b style="color: ${client.balance > 0 ? '#e11d48' : '#16a34a'}">الرصيد المتبقي: ${client.balance.toLocaleString('ar-EG')} ج.م</b>
              </div>
            </div>
          </div>

          <h3>المشاريع المرتبطة</h3>
          <table>
            <thead>
              <tr>
                <th>اسم المشروع</th>
                <th>الحالة</th>
                <th>التكلفة</th>
              </tr>
            </thead>
            <tbody>
              ${projectsList || '<tr><td colspan="3" style="text-align:center; padding: 20px;">لا توجد مشاريع مسجلة</td></tr>'}
            </tbody>
          </table>

          <div class="balance-box">
            <p style="margin: 0; opacity: 0.8; font-size: 14px;">صافي المستحقات المطلوب سدادها</p>
            <h2 style="margin: 10px 0;">${client.balance.toLocaleString('ar-EG')} جنيه مصري فقط لا غير</h2>
          </div>

          <div class="footer">
            <p>هذا المستند تم إنشاؤه آلياً بواسطة نظام إدارة APP STORE.</p>
            <p>شركة APP STORE لتطوير البرمجيات والحلول الرقمية</p>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/clients");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل قائمة العملاء...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة العملاء</h1>
            <p className="text-slate-500 font-bold">عرض وتعديل بيانات العملاء والربط المالي والمشاريع</p>
          </div>
        </div>
        <Button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="rounded-2xl h-14 px-8 font-black text-lg gap-2 shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="h-6 w-6" /> إضافة عميل جديد
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          placeholder="ابحث باسم العميل، رقم الهاتف، أو اسم المشروع..." 
          className="pr-12 pl-12 h-16 rounded-2xl font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        )}
      </div>

      {filteredClients.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none shadow-sm py-20 text-center bg-white">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Users className="h-20 w-20" />
            <p className="text-xl font-black">لم يتم العثور على نتائج للبحث</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group border border-slate-50">
              <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-inner">
                    {client.name?.[0] || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <CardTitle className="text-lg font-black truncate max-w-[120px]">{client.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 truncate" dir="ltr">{client.phone}</span>
                    </div>
                  </div>
                </div>
                
                {/* شريط الإجراءات الموحد والمتناسق */}
                <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm group-hover:border-primary/20 transition-all">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setMessageClient(client)} 
                    className="h-9 w-9 rounded-xl text-primary hover:bg-primary/5" 
                    title="مراسلة سريعة"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handlePrintStatement(client)} 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-50" 
                    title="طباعة كشف حساب"
                  >
                    <Printer className="h-4.5 w-4.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setEditingClient(client); setIsModalOpen(true); }} 
                    className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-50"
                    title="تعديل العميل"
                  >
                    <Edit3 className="h-4.5 w-4.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteClient(client.id!)} 
                    className="h-9 w-9 rounded-xl text-rose-300 hover:text-rose-600 hover:bg-rose-50"
                    title="حذف"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm truncate max-w-[200px]">{client.email || '---'}</span>
                  </div>
                  
                  {client.company && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm truncate max-w-[200px]">{client.company}</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="text-xs font-black uppercase">المشاريع المرتبطة</span>
                      </div>
                      <Badge variant="outline" className="rounded-lg h-5 text-[10px] font-black">
                        {client.associatedProjects?.length || 0} مشاريع
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {client.associatedProjects && client.associatedProjects.length > 0 ? (
                        client.associatedProjects.map((p: any) => (
                          <Link key={p.id} href={`/projects?q=${encodeURIComponent(p.name)}`}>
                            <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black border-slate-100 hover:bg-primary/5 hover:text-primary gap-1 px-3 shadow-sm">
                              {p.name} <ExternalLink className="h-2 w-2" />
                            </Button>
                          </Link>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic py-2">لا توجد مشاريع حالياً</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-black text-[10px] text-slate-400 uppercase">الرصيد المتبقي</span>
                      </div>
                      <span className={`font-black text-lg ${client.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                        {(client.balance || 0).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-400 opacity-60">
                      <span>إجمالي: {client.totalInvoices?.toLocaleString('ar-EG')}</span>
                      <span>المدفوع: {client.totalPayments?.toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Message Modal */}
      <Dialog open={!!messageClient} onOpenChange={() => setMessageClient(null)}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md" dir="rtl">
          <div className="bg-primary p-8 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <MessageCircle className="h-6 w-6" /> مراسلة: {messageClient?.name}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-bold mt-2">
                سيتم إرسال هذه الرسالة مباشرة إلى قسم الدعم الفني الخاص بالعميل.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 pr-2">نص الرسالة</label>
              <Textarea 
                placeholder="اكتب رسالتك السريعة هنا..." 
                className="rounded-2xl min-h-[120px] font-bold border-slate-200"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSendQuickMessage} 
              disabled={isSendingMsg || !quickMessage.trim()}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl"
            >
              {isSendingMsg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-2" />}
              إرسال الرسالة الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingClient(null); }}
        onSave={handleSaveClient}
        isLoading={isSaving}
        initialData={editingClient}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ClientsContent />
    </Suspense>
  );
}
