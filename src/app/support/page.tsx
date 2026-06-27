"use client";

import * as React from "react";
import { useState, useEffect, useRef, Suspense } from "react";
import { 
  Send, Search, Loader2, MessageSquare, ArrowRight, Trash2, Clock, CheckCircle2, Lock, Archive, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, limit, deleteDoc, Unsubscribe 
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from "@/components/language-provider";

function SupportContent() {
  const { t, dir, language } = useTranslation();
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
  const searchParams = useSearchParams();
  const directClientId = searchParams.get('clientId');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadCountRef = useRef<number>(0);

  const isAdmin = profile?.role === 'admin';
  const hasSupportPermission = isAdmin || (profile?.permissions || []).includes('p_support');

  const activeThread = React.useMemo(() => {
    if (!activeThreadId) return null;
    const thread = threads.find(t => t.id === activeThreadId);
    const client = allClients.find(c => c.id === activeThreadId);
    return {
      ...thread,
      clientName: client?.name || thread?.clientName || (language === 'ar' ? 'عميل غير معروف' : 'Unknown Client'),
      clientPhone: client?.phone || thread?.clientPhone || '',
    };
  }, [activeThreadId, threads, allClients, language]);

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
    }
  };

  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!db || authLoading || !profile || !hasSupportPermission) return;
    
    let unsubThreads: Unsubscribe;

    if (isAdmin) {
      unsubThreads = onSnapshot(query(collection(db, "support_threads")), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setThreads(data);
        const totalUnread = data.reduce((acc, curr: any) => acc + (curr.unreadAdmin || 0), 0);
        if (totalUnread > prevUnreadCountRef.current) playNotificationSound();
        prevUnreadCountRef.current = totalUnread;
        setLoading(false);
      }, (err) => { console.error(err); setLoading(false); });
    } else {
      if (profile.clientId) {
        unsubThreads = onSnapshot(doc(db, "support_threads", profile.clientId), (docSnap) => {
          if (docSnap.exists()) setThreads([{ id: docSnap.id, ...docSnap.data() }]);
          setLoading(false);
        }, (err) => { console.error(err); setLoading(false); });
        setActiveThreadId(profile.clientId);
      } else { setLoading(false); }
    }

    onSnapshot(collection(db, "clients"), (snap) => {
      setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (directClientId) setActiveThreadId(directClientId);
  }, [isAdmin, profile, authLoading, hasSupportPermission, directClientId]);

  useEffect(() => {
    if (!db || !activeThreadId || !profile || !hasSupportPermission) return;
    const q = query(collection(db, "support_threads", activeThreadId, "messages"), orderBy("timestamp", "asc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      updateDoc(doc(db, "support_threads", activeThreadId), isAdmin ? { unreadAdmin: 0 } : { unreadClient: 0 }).catch(() => {});
    });
    return () => unsub();
  }, [activeThreadId, isAdmin, profile, hasSupportPermission]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !profile || !db) return;
    const text = inputText.trim();
    setInputText("");
    try {
      await addDoc(collection(db, "support_threads", activeThreadId, "messages"), { text, senderId: profile.uid, senderRole: profile.role, timestamp: serverTimestamp() });
      const client = allClients.find(c => c.id === activeThreadId);
      const updateData: any = { lastMessage: text, lastMessageTime: serverTimestamp(), status: "active", clientName: client?.name || profile?.name || 'User', clientId: activeThreadId };
      if (isAdmin) updateData.unreadClient = increment(1); else updateData.unreadAdmin = increment(1);
      await setDoc(doc(db, "support_threads", activeThreadId), updateData, { merge: true });
    } catch (err) { console.error(err); }
  };

  const handleArchiveThread = async (threadId: string, currentStatus: string) => {
    if (!db) return;
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    await updateDoc(doc(db, "support_threads", threadId), { status: newStatus });
  };

  const searchResults = React.useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    let baseList = threads.filter(t => (t.status || "active") === activeTab);
    if (s) {
      baseList = allClients.filter(c => c.name?.toLowerCase().includes(s) || c.phone?.includes(s)).map(c => ({ id: c.id, clientName: c.name, clientPhone: c.phone, status: threads.find(t=>t.id===c.id)?.status || 'new', lastMessage: threads.find(t=>t.id===c.id)?.lastMessage, lastMessageTime: threads.find(t=>t.id===c.id)?.lastMessageTime }));
    }
    return baseList.sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0));
  }, [threads, allClients, searchQuery, activeTab]);

  if (authLoading || loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  if (!hasSupportPermission) return (
    <div className="max-w-4xl mx-auto py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" /><h2 className="text-2xl font-black">{t('access_restricted')}</h2><Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">{t('back')}</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" dir={dir}>
      {!activeThreadId ? (
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border gap-4">
            <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-2xl text-primary"><MessageSquare className="h-6 w-6" /></div><div><h1 className="text-xl font-black text-slate-800">{t('support_center')}</h1><p className="text-slate-500 font-bold text-xs">{t('support_subtitle')}</p></div></div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto"><TabsList className="h-10 rounded-xl p-1 bg-slate-100 border"><TabsTrigger value="active" className="rounded-lg px-4 font-black text-[10px]">{t('active_threads')}</TabsTrigger><TabsTrigger value="archived" className="rounded-lg px-4 font-black text-[10px]">{t('archived_threads')}</TabsTrigger></TabsList></Tabs>
          </header>
          <div className="relative"><Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4`} /><Input placeholder={t('search_support')} className={`${dir === 'rtl' ? 'pr-12' : 'pl-12'} h-14 rounded-2xl font-black text-sm border-none shadow-sm bg-white focus-visible:ring-primary/20`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((item) => (
              <Card key={item.id} onClick={() => setActiveThreadId(item.id)} className={`rounded-[1.5rem] border-2 cursor-pointer transition-all hover:scale-[1.01] bg-white group overflow-hidden ${item.unreadAdmin > 0 ? 'border-primary' : 'border-slate-50 shadow-sm hover:shadow-md'}`}>
                <div className="p-5 space-y-3"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-base text-white ${item.unreadAdmin > 0 ? 'bg-primary' : 'bg-slate-400'}`}>{item.clientName?.[0] || 'C'}</div><div className="overflow-hidden"><p className="font-black text-slate-800 text-sm truncate">{item.clientName}</p><p className="text-[10px] text-slate-400 font-bold" dir="ltr">{item.clientPhone}</p></div></div>{isAdmin && <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleArchiveThread(item.id, item.status || 'active'); }} className="h-8 w-8 text-slate-400 hover:text-primary"><Archive className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setThreadToDelete(item.id); }} className="h-8 w-8 text-rose-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button></div>}</div><div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 min-h-[50px] flex flex-col justify-center"><p className="text-[10px] text-slate-600 font-bold line-clamp-1 italic">{item.lastMessage || (language === 'ar' ? 'ابدأ المحادثة...' : 'Start conversation...')}</p>{item.lastMessageTime && <div className="flex items-center gap-1 mt-1 text-[8px] font-black text-slate-400 uppercase"><Clock className="h-2.5 w-2.5" />{formatDistanceToNow(new Date(item.lastMessageTime.toDate ? item.lastMessageTime.toDate() : item.lastMessageTime), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}</div>}</div></div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="rounded-[2rem] border-none shadow-xl flex flex-col overflow-hidden bg-white h-[70vh] max-w-xl mx-auto border transition-all">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-900 text-white shrink-0 z-10 shadow-lg">
            <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => isAdmin ? setActiveThreadId(null) : router.push("/")} className="h-10 w-10 rounded-xl hover:bg-white/10 text-white"><ArrowRight className={dir === 'rtl' ? '' : 'rotate-180'} /></Button><div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-md">{activeThread?.clientName?.[0] || 'C'}</div><div className="overflow-hidden"><CardTitle className="text-sm font-black truncate max-w-[150px]">{activeThread?.clientName}</CardTitle><div className="flex items-center gap-1 text-[9px] font-bold text-green-400"><div className="h-1 w-1 rounded-full bg-current animate-pulse" /> {t('online_now')}</div></div></div>
          </CardHeader>
          <ScrollArea className="flex-1 bg-[#fdfdfd] p-4"><div className="space-y-4 max-w-lg mx-auto">{messages.length === 0 && <div className="py-20 text-center space-y-3 opacity-20"><MessageSquare className="h-10 w-10 mx-auto" /><p className="text-xs font-black">{t('no_messages')}</p></div>}{messages.map((msg, idx) => { const isMe = msg.senderId === profile?.uid; return <div key={idx} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}><div className={`p-3 rounded-2xl text-[11px] font-bold max-w-[85%] shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>{msg.text}<div className={`text-[7px] font-black mt-1.5 flex items-center gap-1 opacity-60 ${isMe ? 'justify-end' : 'justify-start'}`}>{(msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date()).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}{isMe && <CheckCircle2 className="h-1.5 w-1.5" />}</div></div></div>; })}{messages.length > 0 && <div ref={messagesEndRef} />}</div></ScrollArea>
          <div className="p-4 border-t bg-white shrink-0 shadow-sm"><form onSubmit={handleSendMessage} className="flex gap-2 max-w-lg mx-auto"><Input placeholder={t('type_message')} className="flex-1 h-12 rounded-xl font-bold text-xs bg-slate-50 border-none px-5" value={inputText} onChange={e => setInputText(e.target.value)} /><Button type="submit" size="icon" disabled={!inputText.trim()} className="h-12 w-12 rounded-xl shadow-lg bg-primary"><Send className="h-5 w-5" /></Button></form></div>
        </Card>
      )}
      <AlertDialog open={!!threadToDelete} onOpenChange={(o) => !o && setThreadToDelete(null)}><AlertDialogContent className="rounded-[1.5rem] p-6 max-w-xs" dir={dir}><AlertDialogHeader className="items-center text-center"><Trash2 className="h-10 w-10 text-rose-500 mb-2" /><AlertDialogTitle className="text-base font-black">{t('delete_chat')}</AlertDialogTitle><AlertDialogDescription className="text-[10px] font-bold text-slate-500">{t('delete_chat_desc')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-row-reverse gap-2 mt-4"><AlertDialogAction onClick={async () => { if(threadToDelete) { await deleteDoc(doc(db!, "support_threads", threadToDelete)); setActiveThreadId(null); setThreadToDelete(null); } }} className="bg-rose-500 h-10 text-xs font-black">{t('delete')}</AlertDialogAction><AlertDialogCancel className="h-10 text-xs font-black">{t('cancel')}</AlertDialogCancel></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

export default function SupportPage() { return <Suspense fallback={<Loader2 className="animate-spin" />}><SupportContent /></Suspense>; }
