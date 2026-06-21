
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
  AlertCircle,
  Trash2,
  X
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
import { useSearchParams } from "next/navigation";

function SupportContent() {
  const { profile, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const cid = searchParams.get('clientId');
  const cname = searchParams.get('name');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile?.role === 'admin';

  // التمرير لأسفل المحادثة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // جلب قائمة المحادثات (للمدير فقط)
  useEffect(() => {
    if (!db || !isAdmin) return;

    const q = query(collection(db, "support_threads"), orderBy("lastMessageTime", "desc"));
    const unsub = onSnapshot(q, 
      (snap) => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.warn("Threads Listener Error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  // تعيين المحادثة النشطة
  useEffect(() => {
    if (profile && !isAdmin) {
      if (profile.clientId) {
        setActiveThreadId(profile.clientId);
      }
      setLoading(false);
    } else if (isAdmin && cid) {
      setActiveThreadId(cid);
      setLoading(false);
    }
  }, [profile, isAdmin, cid]);

  // جلب الرسائل للمحادثة النشطة وتصفير العداد
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
        
        // تصفير عداد الرسائل غير المقروءة عند فتح المحادثة
        const threadRef = doc(db, "support_threads", activeThreadId);
        if (isAdmin) {
          updateDoc(threadRef, { unreadAdmin: 0 }).catch(() => {});
        } else {
          updateDoc(threadRef, { unreadClient: 0 }).catch(() => {});
        }
      },
      (error) => {
        console.warn("Messages Listener Error:", error);
      }
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
      const activeThread = threads.find(t => t.id === threadId);
      
      const updateData: any = {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        clientName: isAdmin ? activeThread?.clientName || cname || "مستفيد" : profile.name,
        clientPhone: isAdmin ? activeThread?.clientPhone || "" : profile.phone || "",
      };

      if (isAdmin) {
        updateData.unreadClient = increment(1);
      } else {
        updateData.unreadAdmin = increment(1);
        updateData.clientId = profile.clientId;
      }

      await setDoc(threadRef, updateData, { merge: true });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في إرسال الرسالة", variant: "destructive" });
    }
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // منع فتح المحادثة عند الضغط على زر الحذف
    
    if (!isAdmin || !db) return;
    
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة نهائياً؟ سيؤدي ذلك لإزالة السجل من قائمتك.")) return;

    try {
      const threadRef = doc(db, "support_threads", threadId);
      await deleteDoc(threadRef);
      
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }

      toast({ title: "تم الحذف", description: "تم مسح المحادثة بنجاح من النظام." });
    } catch (err) {
      console.error("Delete Thread Error:", err);
      toast({ title: "خطأ", description: "عذراً، فشل حذف المحادثة. تأكد من الصلاحيات.", variant: "destructive" });
    }
  };

  const filteredThreads = threads.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    const nameMatch = t.clientName?.toLowerCase().includes(q);
    const phoneMatch = t.clientPhone?.includes(q);
    
    return nameMatch || phoneMatch;
  });

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold text-slate-500">جاري تحميل المحادثات...</p>
    </div>
  );

  if (!isAdmin && !profile?.clientId) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <Card className="rounded-[3rem] p-20 border-dashed border-2">
          <AlertCircle className="h-20 w-20 mx-auto mb-6 text-orange-400" />
          <h2 className="text-3xl font-black text-slate-800">حسابك غير مربوط بمشروع</h2>
          <p className="text-slate-500 font-bold mt-4">يرجى التواصل مع الإدارة لتفعيل خدمات الدعم الفني لمشروعك.</p>
        </Card>
      </div>
    );
  }

  const activeThread = threads.find(t => t.id === activeThreadId);
  const threadDisplayName = isAdmin ? (activeThread?.clientName || cname || "مستفيد") : 'الدعم الفني - APP STORE';

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6" dir="rtl">
      {isAdmin && (
        <Card className="w-full md:w-80 rounded-[2.5rem] border-none shadow-sm flex flex-col overflow-hidden bg-white">
          <CardHeader className="p-6 border-b bg-slate-50/50">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" /> المحادثات
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="ابحث بالاسم أو رقم الهاتف..." 
                className="pr-10 h-10 rounded-xl bg-white border-slate-200 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredThreads.map((thread) => (
                <div 
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative group ${
                    activeThreadId === thread.id ? 'bg-primary text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${
                    activeThreadId === thread.id ? 'bg-white/20' : 'bg-slate-100 text-primary'
                  }`}>
                    {thread.clientName?.[0] || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`font-black text-sm truncate ${activeThreadId === thread.id ? 'text-white' : 'text-slate-800'}`}>
                        {thread.clientName}
                      </p>
                      <div className="flex items-center gap-1">
                        {thread.unreadAdmin > 0 && activeThreadId !== thread.id && (
                          <Badge className="bg-rose-500 text-white rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-bounce">
                            {thread.unreadAdmin}
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleDeleteThread(e, thread.id)}
                          className={`h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 ${
                            activeThreadId === thread.id ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[10px] truncate ${activeThreadId === thread.id ? 'text-white/70' : 'text-slate-400 font-bold'}`}>
                        {thread.lastMessage || 'لا توجد رسائل'}
                      </p>
                      {thread.clientPhone && (
                         <span className={`text-[8px] font-bold ${activeThreadId === thread.id ? 'text-white/50' : 'text-slate-300'}`} dir="ltr">
                           {thread.clientPhone}
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredThreads.length === 0 && (
                <div className="py-10 text-center opacity-30 text-xs font-bold">لا توجد نتائج للبحث</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      <Card className="flex-1 rounded-[2.5rem] border-none shadow-sm flex flex-col overflow-hidden bg-white">
        {activeThreadId ? (
          <>
            <CardHeader className="p-6 border-b flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {isAdmin ? (threadDisplayName?.[0] || 'U') : 'A'}
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-800">
                    {threadDisplayName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">متصل الآن</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setActiveThreadId(null)}
                  className="rounded-full h-10 w-10 hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </Button>
              )}
            </CardHeader>

            <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <LifeBuoy className="h-16 w-16 mb-4" />
                    <p className="font-black text-lg">بدء محادثة جديدة...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === profile?.uid;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                          <div className={`p-4 rounded-[1.8rem] text-sm font-bold shadow-sm ${
                            isMe 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-2 text-[9px] font-black text-slate-400 px-2 ${isMe ? 'justify-start' : 'justify-end'}`}>
                            {msg.timestamp?.seconds ? (
                              <span>{format(msg.timestamp.seconds * 1000, 'p', { locale: ar })}</span>
                            ) : (
                              <span>الآن</span>
                            )}
                            {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="p-6 border-t bg-slate-50/50">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 h-14 rounded-2xl border-none shadow-sm px-6 font-bold bg-white focus-visible:ring-primary/20"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputText.trim()}
                  className="h-14 w-14 rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary">
              <LifeBuoy className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">مركز الدعم والمساعدة</h3>
              <p className="text-slate-500 font-bold max-sm mt-2">
                اختر محادثة من القائمة الجانبية للبدء في التواصل مع المستفيدين وحل استفساراتهم.
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
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-[70vh] gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-bold text-slate-500">جاري تحميل المحادثات...</p></div>}>
      <SupportContent />
    </Suspense>
  );
}
