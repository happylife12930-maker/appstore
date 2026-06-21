"use client";

import * as React from "react";
import { useState, useEffect, useRef, Suspense } from "react";
import { 
  Send, 
  Search, 
  Loader2, 
  Circle,
  CheckCheck,
  Archive,
  ArchiveRestore,
  X,
  MessageSquare,
  ArrowRight,
  Phone,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc,
  increment,
  limit
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SupportContent() {
  const { profile, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const cid = searchParams.get('clientId');
  const cname = searchParams.get('name');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!db || !isAdmin) return;

    const q = query(collection(db, "support_threads"), orderBy("lastMessageTime", "desc"));
    const unsub = onSnapshot(q, 
      (snap) => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (profile && !isAdmin) {
      if (profile.clientId) {
        setActiveThreadId(profile.clientId);
      }
      setLoading(false);
    } else if (isAdmin && cid) {
      setActiveThreadId(cid);
      setActiveTab("active");
      setLoading(false);
    }
  }, [profile, isAdmin, cid]);

  useEffect(() => {
    if (!db || !activeThreadId || !profile) return;

    const q = query(
      collection(db, "support_threads", activeThreadId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(q, 
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const threadRef = doc(db, "support_threads", activeThreadId);
        if (isAdmin) {
          updateDoc(threadRef, { unreadAdmin: 0 }).catch(() => {});
        } else {
          updateDoc(threadRef, { unreadClient: 0 }).catch(() => {});
        }
      },
      () => {}
    );

    return () => unsub();
  }, [activeThreadId, isAdmin, profile]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !profile || !db) return;

    const text = inputText.trim();
    setInputText("");

    const threadId = activeThreadId;
    const msgData = {
      text,
      senderId: profile.uid,
      senderRole: profile.role,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "support_threads", threadId, "messages"), msgData);

      const threadRef = doc(db, "support_threads", threadId);
      const updateData: any = {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        status: "active"
      };

      if (isAdmin) {
        const activeThread = threads.find(t => t.id === threadId);
        updateData.clientName = activeThread?.clientName || cname || "مستفيد";
        updateData.clientPhone = activeThread?.clientPhone || "";
        updateData.unreadClient = increment(1);
      } else {
        updateData.clientName = profile.name || "مستفيد";
        updateData.clientPhone = profile.phone || "";
        updateData.clientId = profile.clientId || profile.uid;
        updateData.unreadAdmin = increment(1);
      }

      await setDoc(threadRef, updateData, { merge: true });
    } catch (err) {
      console.error("Chat Send Error:", err);
    }
  };

  const handleArchiveThread = async (e: React.MouseEvent, threadId: string, isCurrentlyArchived: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAdmin || !db) return;
    
    const threadRef = doc(db, "support_threads", threadId);
    try {
      await updateDoc(threadRef, { status: isCurrentlyArchived ? "active" : "archived" });
      toast({ 
        title: isCurrentlyArchived ? "تمت الاستعادة" : "تمت الأرشفة", 
        description: isCurrentlyArchived ? "المحادثة الآن في القائمة النشطة." : "تم نقل المحادثة إلى الأرشيف." 
      });
      if (!isCurrentlyArchived && activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحديث حالة المحادثة.", variant: "destructive" });
    }
  };

  const filteredThreads = threads.filter(t => {
    const threadStatus = t.status || "active";
    if (threadStatus !== activeTab) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = t.clientName?.toLowerCase().includes(q);
    const phoneMatch = t.clientPhone?.toLowerCase().includes(q);
    return nameMatch || phoneMatch;
  });

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل المحادثات...</p>
    </div>
  );

  const activeThread = threads.find(t => t.id === activeThreadId);
  const threadDisplayName = isAdmin ? (activeThread?.clientName || cname || "مستفيد") : 'الدعم الفني - APP STORE';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10" dir="rtl">
      {!activeThreadId ? (
        <div className="space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">مركز المراسلات</h1>
                <p className="text-slate-500 font-bold">إدارة استفسارات العملاء والدعم الفني</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 w-full md:w-[300px] rounded-2xl p-1 bg-slate-100">
                <TabsTrigger value="active" className="rounded-xl font-black text-sm data-[state=active]:bg-white">نشطة</TabsTrigger>
                <TabsTrigger value="archived" className="rounded-xl font-black text-sm data-[state=active]:bg-white">الأرشيف</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="ابحث باسم العميل أو رقم الهاتف للوصول السريع للمحادثة..." 
              className="pr-12 h-16 rounded-[1.5rem] font-bold text-lg border-none shadow-sm bg-white focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThreads.map((thread) => (
              <Card 
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden cursor-pointer group border border-slate-50"
              >
                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                      {thread.clientName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">{thread.clientName}</p>
                      {thread.clientPhone && (
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1" dir="ltr">
                          <Phone className="h-2.5 w-2.5" /> {thread.clientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  {thread.unreadAdmin > 0 && (
                    <Badge className="bg-rose-500 text-white rounded-full h-7 min-w-7 flex items-center justify-center p-1 text-[10px] animate-bounce">
                      {thread.unreadAdmin}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed">
                      {thread.lastMessage || 'محادثة جديدة بانتظار الرد...'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-300">
                      <Clock className="h-3 w-3" />
                      <span>{thread.lastMessageTime ? format(thread.lastMessageTime.toDate(), 'eeee p', { locale: ar }) : 'الآن'}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => handleArchiveThread(e, thread.id, activeTab === "archived")}
                      className="h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 font-black text-[10px] gap-1"
                    >
                      {activeTab === "archived" ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      {activeTab === "archived" ? "استعادة" : "أرشفة"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredThreads.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-20">
                <MessageSquare className="h-20 w-20 mx-auto mb-4" />
                <p className="text-2xl font-black">لا توجد محادثات في هذه القائمة</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="rounded-[2.5rem] border-none shadow-2xl flex flex-col overflow-hidden bg-white min-h-[85vh]">
          <CardHeader className="p-8 border-b flex flex-row items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setActiveThreadId(null); setMessages([]); router.push('/support'); }}
                className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-primary hover:text-white transition-all"
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-3xl shadow-xl">
                {isAdmin ? (threadDisplayName?.[0] || 'U') : 'A'}
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">
                  {threadDisplayName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نشط الآن</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-8 bg-slate-50/20" viewportRef={scrollRef}>
            <div className="space-y-10 max-w-5xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                  <div className="p-10 bg-white rounded-[3rem] shadow-sm mb-6 border">
                    <MessageSquare className="h-16 w-16 text-primary" />
                  </div>
                  <p className="font-black text-2xl tracking-tight">ابدأ المحادثة الرسمية الآن...</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === profile?.uid;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[80%] md:max-w-[60%] space-y-2">
                        <div className={`p-6 rounded-[2.5rem] text-lg font-bold shadow-sm leading-relaxed ${
                          isMe 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-md'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-3 text-[10px] font-black text-slate-400 px-6 ${isMe ? 'justify-start' : 'justify-end'}`}>
                          {msg.timestamp?.seconds ? (
                            <span>{format(msg.timestamp.seconds * 1000, 'p', { locale: ar })}</span>
                          ) : (
                            <span>الآن</span>
                          )}
                          {isMe && <CheckCheck className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="p-10 border-t bg-white">
            <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-4 max-w-5xl mx-auto">
              <Input 
                placeholder="اكتب رسالتك هنا..." 
                className="flex-1 h-20 rounded-[2rem] border-none shadow-inner px-10 font-bold text-xl bg-slate-50 focus-visible:ring-primary/20 placeholder:text-slate-300"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputText.trim()}
                className="h-20 w-20 rounded-[2rem] shadow-2xl active:scale-95 transition-all bg-primary hover:bg-slate-900"
              >
                <Send className="h-8 w-8" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-500">جاري تحميل واجهة المراسلات...</p>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
