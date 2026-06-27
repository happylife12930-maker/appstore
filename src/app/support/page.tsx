
"use client";

import * as React from "react";
import { useState, useEffect, useRef, Suspense } from "react";
import { 
  Send, Search, Loader2, MessageSquare, ArrowRight, Trash2, UserPlus, Phone, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, limit, deleteDoc 
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function SupportContent() {
  const { profile, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile?.role === 'admin';
  const hasSupportPermission = isAdmin || (profile?.permissions || []).includes('p_support');

  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!db || authLoading || !profile || !hasSupportPermission) {
      if (!authLoading) setLoading(false);
      return;
    }
    
    if (isAdmin) {
      const unsubThreads = onSnapshot(query(collection(db, "support_threads"), orderBy("lastMessageTime", "desc")), (snap) => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (e) => console.warn("Threads Denied:", e));

      const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
        setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (e) => console.warn("Clients Denied:", e));

      return () => { unsubThreads(); unsubClients(); };
    } else {
      if (profile.clientId) setActiveThreadId(profile.clientId);
      setLoading(false);
    }
  }, [isAdmin, profile, authLoading, hasSupportPermission]);

  useEffect(() => {
    if (!db || !activeThreadId || !profile || !hasSupportPermission) return;
    const q = query(collection(db, "support_threads", activeThreadId, "messages"), orderBy("timestamp", "asc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      updateDoc(doc(db, "support_threads", activeThreadId), isAdmin ? { unreadAdmin: 0 } : { unreadClient: 0 }).catch(() => {});
    }, (e) => console.warn("Messages Denied:", e));
    return () => unsub();
  }, [activeThreadId, isAdmin, profile, hasSupportPermission]);

  if (authLoading || loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  if (!hasSupportPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">الدعم الفني مقيد</h2>
          <p className="text-slate-500 font-bold text-sm">ليس لديك صلاحية الوصول للمراسلات حالياً. يرجى مراجعة مدير الوكالة.</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !profile || !db) return;
    const text = inputText.trim();
    setInputText("");
    try {
      await addDoc(collection(db, "support_threads", activeThreadId, "messages"), { text, senderId: profile.uid, senderRole: profile.role, timestamp: serverTimestamp() });
      const updateData: any = { lastMessage: text, lastMessageTime: serverTimestamp(), status: "active" };
      if (isAdmin) updateData.unreadClient = increment(1); else updateData.unreadAdmin = increment(1);
      await setDoc(doc(db, "support_threads", activeThreadId), updateData, { merge: true });
    } catch (err) {}
  };

  const filteredResults = threads.filter(t => (t.status || "active") === activeTab);

  return (
    <div className="max-w-4xl mx-auto space-y-4" dir="rtl">
      {!activeThreadId ? (
        <>
          <header className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /><h1 className="text-sm font-black">مركز المراسلات</h1></div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8 rounded-lg">
                <TabsTrigger value="active" className="text-[10px] font-bold">نشطة</TabsTrigger>
                <TabsTrigger value="archived" className="text-[10px] font-bold">الأرشيف</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>
          <Input placeholder="ابحث برقم الهاتف..." className="h-10 rounded-xl text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} dir="ltr" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResults.map((item) => (
              <Card key={item.id} onClick={() => setActiveThreadId(item.id)} className="rounded-xl border-none shadow-sm cursor-pointer hover:shadow-md bg-white border">
                <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{item.clientName?.[0]}</div><div><p className="font-black text-xs">{item.clientName}</p><p className="text-[9px] text-slate-400 font-bold" dir="ltr">{item.clientPhone}</p></div></div>
                </CardHeader>
                <CardContent className="p-3 pt-0"><p className="text-[10px] text-slate-500 line-clamp-1 italic">{item.lastMessage || 'لا توجد رسائل'}</p></CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="rounded-2xl border-none shadow-lg flex flex-col overflow-hidden bg-white h-[70vh]">
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => isAdmin ? setActiveThreadId(null) : router.push("/")} className="h-8 w-8 rounded-lg"><ArrowRight className="h-4 w-4" /></Button>
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">{isAdmin ? 'C' : 'A'}</div>
              <CardTitle className="text-xs font-black">{isAdmin ? 'محادثة العميل' : 'الدعم الفني'}</CardTitle>
            </div>
            {isAdmin && <Button variant="ghost" size="icon" onClick={() => setThreadToDelete(activeThreadId)} className="h-8 w-8 text-rose-300"><Trash2 className="h-4 w-4" /></Button>}
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === profile?.uid;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-2.5 rounded-xl text-[10px] font-bold max-w-[75%] shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>{msg.text}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-3 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input placeholder="اكتب رسالتك..." className="flex-1 h-9 rounded-lg text-xs" value={inputText} onChange={e => setInputText(e.target.value)} />
              <Button type="submit" size="icon" disabled={!inputText.trim()} className="h-9 w-9 rounded-lg"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </Card>
      )}
      <AlertDialog open={!!threadToDelete} onOpenChange={(o) => !o && setThreadToDelete(null)}>
        <AlertDialogContent className="rounded-xl max-w-sm" dir="rtl">
          <AlertDialogHeader><AlertDialogTitle className="text-base font-black">حذف المحادثة؟</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription className="text-xs font-bold">سيتم مسح سجل المحادثة تماماً من النظام.</AlertDialogDescription>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={async () => { if(threadToDelete) { await deleteDoc(doc(db!, "support_threads", threadToDelete)); setActiveThreadId(null); setThreadToDelete(null); } }} className="bg-rose-500 text-xs h-10">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel className="text-xs h-10">تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SupportPage() { return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><SupportContent /></Suspense>; }
