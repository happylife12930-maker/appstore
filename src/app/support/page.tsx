
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
  Clock,
  Trash2
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
  limit,
  deleteDoc
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

  // التمرير التلقائي لآخر رسالة
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
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

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAdmin || !db || !confirm("هل أنت متأكد من حذف هذه المحادثة نهائياً من سجلاتك؟")) return;
    
    try {
      await deleteDoc(doc(db, "support_threads", threadId));
      toast({ title: "تم الحذف", description: "تم مسح المحادثة نهائياً بنجاح." });
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete Thread Error:", err);
      toast({ title: "خطأ", description: "فشل حذف المحادثة، تأكد من صلاحيات الإدارة.", variant: "destructive" });
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
    <div className="max-w-6xl mx-auto" dir="rtl">
      {!activeThreadId ? (
        <div className="space-y-4">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">مركز المراسلات</h1>
                <p className="text-[10px] font-bold text-slate-400">إدارة استفسارات العملاء والدعم الفني</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 w-full md:w-[200px] rounded-xl p-1 bg-slate-100 h-10">
                <TabsTrigger value="active" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white">نشطة</TabsTrigger>
                <TabsTrigger value="archived" className="rounded-lg font-black text-[10px] data-[state=active]:bg-white">الأرشيف</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              placeholder="ابحث باسم العميل أو رقم الهاتف..." 
              className="pr-12 h-12 rounded-2xl font-bold border-none shadow-sm bg-white focus-visible:ring-primary/20 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThreads.map((thread) => (
              <Card 
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden cursor-pointer group border border-slate-50"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base group-hover:bg-primary group-hover:text-white transition-colors">
                      {thread.clientName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-xs">{thread.clientName}</p>
                      {thread.clientPhone && (
                        <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1" dir="ltr">
                          <Phone className="h-2 w-2" /> {thread.clientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  {thread.unreadAdmin > 0 && (
                    <Badge className="bg-rose-500 text-white rounded-full h-5 min-w-5 flex items-center justify-center p-1 text-[8px]">
                      {thread.unreadAdmin}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 line-clamp-1">
                      {thread.lastMessage || 'محادثة جديدة...'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[8px] font-black text-slate-300">
                      <Clock className="h-2 w-2" />
                      <span>{thread.lastMessageTime ? format(thread.lastMessageTime.toDate(), 'eeee p', { locale: ar }) : 'الآن'}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleArchiveThread(e, thread.id, activeTab === "archived")}
                        className="h-6 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 font-black text-[8px] gap-1 px-2"
                      >
                        {activeTab === "archived" ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                        {activeTab === "archived" ? "استعادة" : "أرشفة"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDeleteThread(e, thread.id)}
                        className="h-6 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 font-black text-[8px] gap-1 px-2"
                      >
                        <Trash2 className="h-3 w-3" /> حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredThreads.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-20">
                <MessageSquare className="h-16 w-16 mx-auto mb-3" />
                <p className="text-xl font-black">لا توجد محادثات</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="rounded-[2rem] border-none shadow-xl flex flex-col overflow-hidden bg-white h-[75vh]">
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setActiveThreadId(null); setMessages([]); router.push('/support'); }}
                className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-primary hover:text-white transition-all"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg">
                {isAdmin ? (threadDisplayName?.[0] || 'U') : 'A'}
              </div>
              <div>
                <CardTitle className="text-sm font-black text-slate-800">
                  {threadDisplayName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500 animate-pulse" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">متصل</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => handleDeleteThread(e, activeThreadId)}
                className="h-9 w-9 rounded-xl text-rose-300 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 px-4 py-4 bg-slate-50/10" viewportRef={scrollRef}>
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-2 border">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-black text-sm">ابدأ المحادثة الآن...</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === profile?.uid;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[80%] md:max-w-[60%] space-y-0.5">
                        <div className={`p-2.5 rounded-2xl text-[11px] font-bold shadow-sm leading-relaxed ${
                          isMe 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-2 text-[7px] font-black text-slate-400 px-2 ${isMe ? 'justify-start' : 'justify-end'}`}>
                          {msg.timestamp?.seconds ? (
                            <span>{format(msg.timestamp.seconds * 1000, 'p', { locale: ar })}</span>
                          ) : (
                            <span>الآن</span>
                          )}
                          {isMe && <CheckCheck className="h-2.5 w-2.5 text-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-white shrink-0">
            <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 max-w-4xl mx-auto">
              <Input 
                placeholder="اكتب رسالتك..." 
                className="flex-1 h-10 rounded-xl border-none shadow-inner px-4 font-bold text-xs bg-slate-50 focus-visible:ring-primary/20"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputText.trim()}
                className="h-10 w-10 rounded-xl shadow-lg active:scale-95 transition-all bg-primary"
              >
                <Send className="h-4 w-4" />
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
        <p className="font-bold text-slate-500">جاري تحميل الدردشة...</p>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
