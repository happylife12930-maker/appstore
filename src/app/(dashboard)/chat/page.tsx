
"use client";

import * as React from "react";
import { useState } from "react";
import { 
  Search, 
  Paperclip, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const contacts = [
  { id: 1, name: "Ahmed Khalil", status: "online", lastMsg: "Looks good, let's proceed.", time: "12:30 PM", unread: 2 },
  { id: 2, name: "Sarah Johnson", status: "offline", lastMsg: "Can we update the logo?", time: "Yesterday", unread: 0 },
  { id: 3, name: "Omar Zayed", status: "online", lastMsg: "Sent the requirements document.", time: "Mon", unread: 0 },
];

const initialMessages = [
  { id: 1, text: "Hello! How is the progress on the Android app?", sender: "client", time: "10:00 AM" },
  { id: 2, text: "We just finished the authentication module. Working on the dashboard now.", sender: "me", time: "10:05 AM" },
  { id: 3, text: "Great! Can you share a screenshot of the login page?", sender: "client", time: "10:10 AM" },
  { id: 4, type: "image", src: "https://picsum.photos/seed/chat/400/300", sender: "me", time: "10:15 AM" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: "me", time: "Just now" }]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6 overflow-hidden">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col shadow-sm border-none">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {contacts.map((contact) => (
              <button 
                key={contact.id} 
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left ${contact.id === 1 ? 'bg-muted' : ''}`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={`https://picsum.photos/seed/${contact.id}/100/100`} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${contact.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-sm truncate">{contact.name}</span>
                    <span className="text-[10px] text-muted-foreground">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate">{contact.lastMsg}</p>
                    {contact.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat */}
      <Card className="flex-1 flex flex-col shadow-sm border-none relative overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src="https://picsum.photos/seed/1/100/100" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">Ahmed Khalil</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] space-y-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'image' ? (
                    <div className="rounded-2xl overflow-hidden border-4 border-white shadow-sm">
                      <img src={msg.src} alt="sent image" className="max-w-full h-auto" />
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'me' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-white text-foreground rounded-tl-none border'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground px-2">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl">
            <Button variant="ghost" size="icon" className="shrink-0"><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-5 w-5 text-muted-foreground" /></Button>
            <Input 
              placeholder="Type a message..." 
              className="border-none bg-transparent shadow-none focus-visible:ring-0" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button variant="ghost" size="icon" className="shrink-0"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Button onClick={handleSend} className="shrink-0 rounded-lg h-10 w-10 p-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
