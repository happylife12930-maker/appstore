
"use client";

import * as React from "react";
import { useState, useEffect, useRef, Suspense } from "react";
import { 
  Send, Search, Loader2, MessageSquare, ArrowRight, Trash2, Clock, CheckCircle2, Lock, Bell, User, Archive, RotateCcw
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
import { ar } from 'date-fns/locale';

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
      clientName: client?.name || thread?.clientName || 'عميل غير معروف',
      clientPhone: client?.phone || thread?.clientPhone || '',
    };
  }, [activeThreadId, threads, allClients]);

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

    // الأدمن فقط هو من يراقب كافة الخيوط
    if (isAdmin) {
      unsubThreads = onSnapshot(query(collection(db, "support_threads")), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setThreads(data);
        
        const totalUnread = data.reduce((acc, curr: any) => acc + (curr.unreadAdmin || 0), 0);
        if (totalUnread > prevUnreadCountRef.current) {
          playNotificationSound();
        }
        prevUnreadCountRef.current = totalUnread;
        setLoading(false);
      }, (err) => {
        console.error("Threads Access Error:", err);
        setLoading(false);
      });
    } else {
      // العميل يراقب فقط محادثته الخاصة لضمان عدم حدوث خطأ Permission Denied
      if (profile.clientId) {
        unsubThreads = onSnapshot(doc(db, "support_threads", profile.clientId), (docSnap) => {
          if (docSnap.exists()) {
            setThreads([{ id: docSnap.id, ...docSnap.data() }]);
          }
          setLoading(false);
        }, (err) => {
          console.error("Personal Thread Access Error:", err);
          setLoading(false);
        });
        setActiveThreadId(profile.clientId);
      } else {
        setLoading(false);
      }
    }

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
      setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (directClientId) {
      setActiveThreadId(directClientId);
    }

    return () => { 
      if (unsubThreads) unsubThreads(); 
      unsubClients(); 
    };
  }, [isAdmin, profile, authLoading, hasSupportPermission, directClientId]);

  useEffect(() => {
    if (!db || !activeThreadId || !profile || !hasSupportPermission) return;
    const q = query(collection(db, "support_threads", activeThreadId, "messages"), orderBy("timestamp", "asc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      updateDoc(doc(db, "support_threads", activeThreadId), isAdmin ? { unreadAdmin: 0 } : { unreadClient: 0 }).catch(() => {});
    }, (e) => console.warn("Messages Access Denied:", e));
    return () => unsub();
  }, [activeThreadId, isAdmin, profile, hasSupportPermission]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !profile || !db) return;
    
    const text = inputText.trim();
    setInputText("");

    try {
      await addDoc(collection(db, "support_threads", activeThreadId, "messages"), { 
        text, 
        senderId: profile.uid, 
        senderRole: profile.role, 
        timestamp: serverTimestamp() 
      });

      const client = allClients.find(c => c.id === activeThreadId);

      const updateData: any = { 
        lastMessage: text, 
        lastMessageTime: serverTimestamp(), 
        status: "active",
        clientName: client?.name || profile?.name || 'عميل',
        clientPhone: client?.phone || profile?.phone || '',
        clientId: activeThreadId
      };

      if (isAdmin) {
        updateData.unreadClient = increment(1);
      } else {
        updateData.unreadAdmin = increment(1);
      }

      await setDoc(doc(db, "support_threads", activeThreadId), updateData, { merge: true });
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const handleArchiveThread = async (threadId: string, currentStatus: string) => {
    if (!db) return;
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await updateDoc(doc(db, "support_threads", threadId), { status: newStatus });
      toast({ 
        title: newStatus === 'archived' ? "تم النقل للأرشيف" : "تمت الاستعادة",
        description: newStatus === 'archived' ? "المحادثة الآن في قائمة الأرشيف." : "المحادثة عادت للقائمة النشطة."
      });
    } catch (err) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const searchResults = React.useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    
    let baseList = [];
    if (!s) {
      baseList = threads
        .filter(t => (t.status || "active") === activeTab)
        .map(t => {
          const client = allClients.find(c => c.id === t.id);
          return { 
            ...t, 
            clientName: client?.name || t.clientName || 'بدون اسم',
            clientPhone: client?.phone || t.clientPhone || ''
          };
        });
    } else {
      const matchedClients = allClients.filter(c => 
        c.name?.toLowerCase().includes(s) || 
        c.phone?.includes(s) || 
        c.phone2?.includes(s)
      );

      baseList = matchedClients.map(client => {
        const existingThread = threads.find(t => t.id === client.id);
        return {
          id: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          lastMessage: existingThread?.lastMessage || 'ابدأ محادثة جديدة...',
          lastMessageTime: existingThread?.lastMessageTime,
          unreadAdmin: existingThread?.unreadAdmin || 0,
          status: existingThread?.status || 'new'
        };
      });
    }

    return baseList.sort((a, b) => {
      const timeA = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate().getTime() : 0;
      const timeB = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [threads, allClients, searchQuery, activeTab]);

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-black text-slate-400">جاري تحميل مركز المراسلات...</p>
    </div>
  );

  if (!hasSupportPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-dashed border-slate-200">
          <Lock className="h-16 w-16 mx-auto mb-6 text-slate-200" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">الدعم الفني مقيد</h2>
          <p className="text-slate-500 font-bold text-sm">ليس لديك صلاحية الوصول للمراسلات حالياً.</p>
          <Button onClick={() => router.push("/")} className="mt-8 rounded-xl h-10 px-8 font-black">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" dir="rtl">
      {!activeThreadId ? (
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary relative">
                <MessageSquare className="h-6 w-6" />
                {threads.some(t => t.unreadAdmin > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">مركز المراسلات</h1>
                <p className="text-slate-500 font-bold text-xs">تواصل مباشر مع العملاء</p>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="h-10 rounded-xl p-1 bg-slate-100 border">
                <TabsTrigger value="active" className="rounded-lg px-4 font-black text-[10px] data-[state=active]:bg-white">نشطة</TabsTrigger>
                <TabsTrigger value="archived" className="rounded-lg px-4 font-black text-[10px] data-[state=active]:bg-white">الأرشيف</TabsTrigger>
              </TabsList>
            </Tabs>
          </header>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              placeholder="ابحث بالاسم، رقم الهاتف أو الموبايل..." 
              className="pr-12 h-14 rounded-2xl font-black text-sm border-none shadow-sm bg-white focus-visible:ring-primary/20" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((item) => (
              <Card 
                key={item.id} 
                onClick={() => setActiveThreadId(item.id)} 
                className={`rounded-[1.5rem] border-2 cursor-pointer transition-all hover:scale-[1.01] bg-white group overflow-hidden ${item.unreadAdmin > 0 ? 'border-primary' : 'border-slate-50 shadow-sm hover:shadow-md'}`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md transition-all group-hover:rotate-6 ${item.unreadAdmin > 0 ? 'bg-primary' : 'bg-slate-400'}`}>
                        {item.clientName?.[0] || 'C'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm truncate">{item.clientName}</p>
                        <p className="text-[10px] text-slate-400 font-bold" dir="ltr">{item.clientPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.unreadAdmin > 0 && (
                        <Badge className="bg-rose-500 text-white rounded-lg px-2 h-6 text-[9px] font-black ml-1">
                          {item.unreadAdmin} رسايل
                        </Badge>
                      )}
                      {isAdmin && item.status !== 'new' && (
                        <div className="flex gap-0.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveThread(item.id, item.status || 'active');
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title={activeTab === 'active' ? 'أرشفة' : 'استعادة'}
                          >
                            {activeTab === 'active' ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setThreadToDelete(item.id);
                            }}
                            className="h-8 w-8 text-rose-300 hover:text-rose-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 min-h-[50px] flex flex-col justify-center">
                    <p className="text-[10px] text-slate-600 font-bold line-clamp-1 italic">
                      {item.lastMessage || 'ابدأ المحادثة الآن...'}
                    </p>
                    {item.lastMessageTime && (
                      <div className="flex items-center gap-1 mt-1 text-[8px] font-black text-slate-400 uppercase">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(item.lastMessageTime.toDate ? item.lastMessageTime.toDate() : item.lastMessageTime), { addSuffix: true, locale: ar })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {searchResults.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30">
                <Search className="h-12 w-12 mx-auto mb-4" />
                <p className="font-black">لم يتم العثور على نتائج تطابق بحثك</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="rounded-[2rem] border-none shadow-xl flex flex-col overflow-hidden bg-white h-[70vh] max-w-xl mx-auto border transition-all">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-900 text-white shrink-0 z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => isAdmin ? setActiveThreadId(null) : router.push("/")} className="h-10 w-10 rounded-xl hover:bg-white/10 text-white transition-all active:scale-90">
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-md border border-white/10 overflow-hidden">
                {activeThread?.clientName?.[0] || 'C'}
              </div>
              <div className="overflow-hidden">
                <CardTitle className="text-sm font-black truncate max-w-[150px]">{activeThread?.clientName || 'محادثة العميل'}</CardTitle>
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-400">
                  <div className="h-1 w-1 rounded-full bg-current animate-pulse" /> متصل الآن
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleArchiveThread(activeThreadId!, activeThread?.status || 'active')}
                  className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                  title="أرشفة المحادثة"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setThreadToDelete(activeThreadId)} 
                  className="h-9 w-9 text-rose-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  title="حذف المحادثة"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          <ScrollArea className="flex-1 bg-[#fdfdfd] p-4">
            <div className="space-y-4 max-w-lg mx-auto">
              {messages.length === 0 && (
                <div className="py-20 text-center space-y-3 opacity-20">
                  <MessageSquare className="h-10 w-10 mx-auto" />
                  <p className="text-xs font-black">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === profile?.uid;
                const msgTime = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();

                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                    <div className={`p-3 rounded-2xl text-[11px] font-bold max-w-[85%] shadow-sm transition-all hover:shadow-md ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                      <div className={`text-[7px] font-black mt-1.5 flex items-center gap-1 opacity-60 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msgTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <CheckCircle2 className="h-1.5 w-1.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-lg mx-auto">
              <Input 
                placeholder="اكتب رسالتك..." 
                className="flex-1 h-12 rounded-xl font-bold text-xs bg-slate-50 border-none px-5 focus-visible:ring-primary/20" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputText.trim()} 
                className="h-12 w-12 rounded-xl shadow-lg bg-primary transition-all active:scale-95"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      <AlertDialog open={!!threadToDelete} onOpenChange={(o) => !o && setThreadToDelete(null)}>
        <AlertDialogContent className="rounded-[1.5rem] p-6 max-w-xs" dir="rtl">
          <AlertDialogHeader className="items-center text-center">
            <Trash2 className="h-10 w-10 text-rose-500 mb-2" />
            <AlertDialogTitle className="text-base font-black">حذف المحادثة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-bold text-slate-500">
              سيتم مسح سجل المحادثة تماماً من النظام. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 mt-4">
            <AlertDialogAction 
              onClick={async () => { 
                if(threadToDelete) { 
                  await deleteDoc(doc(db!, "support_threads", threadToDelete)); 
                  setActiveThreadId(null); 
                  setThreadToDelete(null); 
                  toast({ title: "تم الحذف", description: "تم مسح المحادثة بنجاح." });
                } 
              }} 
              className="bg-rose-500 h-10 text-xs font-black hover:bg-rose-600"
            >
              تأكيد الحذف
            </AlertDialogAction>
            <AlertDialogCancel className="h-10 text-xs font-black">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SupportPage() { return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>}><SupportContent /></Suspense>; }
