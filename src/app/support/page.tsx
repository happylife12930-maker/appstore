
"use client";

import * as React from "react";
import { useState, useEffect, useRef, Suspense } from "react";
import { 
  Send, 
  LifeBuoy, 
  Search, 
  Loader2, 
  Circle,
  CheckCheck,
  Archive,
  ArchiveRestore,
  X,
  MessageSquare,
  User
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
import { useSearchParams } from "next/navigation";
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

  // مراقبة كافة المحادثات (للأدمن)
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

  // تحديد المحادثة النشطة عند التحميل من رابط خارجي
  useEffect(() => {
    if (profile && !isAdmin) {
      if (profile.clientId) {
        setActiveThreadId(profile.clientId);
      }
      setLoading(false);
    } else if (isAdmin && cid) {
      setActiveThreadId(cid);
      // التأكد من أن التبويب هو النشط إذا تم فتح العميل
      setActiveTab("active");
      setLoading(false);
    }
  }, [profile, isAdmin, cid]);

  // مراقبة الرسائل في المحادثة المختارة
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
        
        // تصفير العداد عند فتح المحادثة
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
      // 1. إضافة الرسالة للمجموعة الفرعية
      await addDoc(collection(db, "support_threads", threadId, "messages"), msgData);

      // 2. تحديث مستند المحادثة الرئيسي مع التأكيد القوي على الحالة "active"
      const threadRef = doc(db, "support_threads", threadId);
      
      const updateData: any = {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        status: "active" // إجبار الحالة على نشط لتخرج من الأرشيف فوراً
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
    const phoneMatch = t.clientPhone?.includes(q);
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
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4" dir="rtl">
      {isAdmin && (
        <Card className="w-full md:w-96 rounded-3xl border-none shadow-sm flex flex-col overflow-hidden bg-white">
          <CardHeader className="p-6 border-b bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" /> البريد
              </CardTitle>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-2xl p-1 bg-slate-200/50">
                <TabsTrigger value="active" className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">الرسائل</TabsTrigger>
                <TabsTrigger value="archived" className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">الأرشيف</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="بحث بالاسم أو الرقم..." 
                className="pr-10 h-12 rounded-2xl bg-white border-slate-200 font-bold text-sm shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredThreads.map((thread) => (
                <div 
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-4 rounded-[2rem] cursor-pointer transition-all flex items-center gap-4 relative group ${
                    activeThreadId === thread.id ? 'bg-primary text-white shadow-xl scale-[0.98]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
                    activeThreadId === thread.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-primary'
                  }`}>
                    {thread.clientName?.[0] || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`font-black text-base truncate ${activeThreadId === thread.id ? 'text-white' : 'text-slate-800'}`}>
                        {thread.clientName}
                      </p>
                      <div className="flex items-center gap-2">
                        {thread.unreadAdmin > 0 && activeThreadId !== thread.id && (
                          <Badge className="bg-rose-500 text-white rounded-full h-6 min-w-6 flex items-center justify-center p-1 text-[10px] animate-bounce border-2 border-white shadow-sm">
                            {thread.unreadAdmin}
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleArchiveThread(e, thread.id, activeTab === "archived")}
                          className={`h-9 w-9 rounded-xl transition-all ${
                            activeThreadId === thread.id ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-primary hover:bg-primary/5'
                          }`}
                          title={activeTab === "archived" ? "استعادة للنشطة" : "نقل للأرشيف"}
                        >
                          {activeTab === "archived" ? <ArchiveRestore className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                    <p className={`text-xs truncate ${activeThreadId === thread.id ? 'text-white/70' : 'text-slate-400 font-bold'}`}>
                      {thread.lastMessage || 'محادثة جديدة'}
                    </p>
                  </div>
                </div>
              ))}
              {filteredThreads.length === 0 && (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                   <div className="p-5 bg-slate-50 rounded-full">
                     <MessageSquare className="h-10 w-10 text-slate-300" />
                   </div>
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest">لا توجد محادثات</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      <Card className="flex-1 rounded-3xl border-none shadow-sm flex flex-col overflow-hidden bg-white border border-slate-100">
        {activeThreadId ? (
          <>
            <CardHeader className="p-6 border-b flex flex-row items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {isAdmin ? (threadDisplayName?.[0] || 'U') : 'A'}
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-800">
                    {threadDisplayName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">متصل الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setActiveThreadId(null)}
                    className="rounded-2xl h-12 w-12 border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                 )}
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-8" viewportRef={scrollRef}>
              <div className="space-y-8 max-w-5xl mx-auto">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 opacity-20">
                    <div className="p-8 bg-slate-50 rounded-[3rem] mb-6">
                      <LifeBuoy className="h-16 w-16" />
                    </div>
                    <p className="font-black text-2xl tracking-tight">ابدأ المحادثة الآن...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === profile?.uid;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                          <div className={`p-5 rounded-[2.5rem] text-base font-bold shadow-sm leading-relaxed ${
                            isMe 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-3 text-[10px] font-black text-slate-400 px-4 ${isMe ? 'justify-start' : 'justify-end'}`}>
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

            <div className="p-8 border-t bg-slate-50/50">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-4 max-w-5xl mx-auto">
                <Input 
                  placeholder="اكتب رسالتك للمستفيد هنا..." 
                  className="flex-1 h-16 rounded-[2rem] border-none shadow-xl px-8 font-bold text-lg bg-white focus-visible:ring-primary/20 placeholder:text-slate-300"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputText.trim()}
                  className="h-16 w-16 rounded-[2rem] shadow-2xl active:scale-95 transition-all bg-primary hover:bg-slate-900"
                >
                  <Send className="h-7 w-7" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
              <div className="relative z-10 h-40 w-40 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-primary mb-10 border border-slate-50">
                <MessageSquare className="h-16 w-16" />
              </div>
            </div>
            <div className="max-w-md space-y-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">منصة المراسلة الفورية</h3>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">
                تواصل مع عملائك، قدم الدعم الفني، وتابع استفسارات المشاريع من مكان واحد وبسرعة فائقة.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-500">جاري تحميل واجهة المحادثات...</p>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
