import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Bot, History, Search, Loader2, Sparkles, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { databaseService } from "@/services/database";
import { aiService, type ChatMessage } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { PreferenceService } from "@/services/preferences";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreenState] = useState<boolean>(() => {
    try { return sessionStorage.getItem('ai_fullscreen') === 'true'; } catch { return false; }
  });
  // Optional draggable bubble position (persisted per session)
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(() => {
    try { const raw = sessionStorage.getItem('ai_bubble_pos'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const dragRef = useRef<{ dragging: boolean; dx: number; dy: number }>({ dragging: false, dx: 0, dy: 0 });
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'search'>('chat');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkAIStatusCb = React.useCallback(checkAIStatus, [toast]);
  const loadChatHistoryCb = React.useCallback(loadChatHistory, [user?.id]);
  useEffect(() => { checkAIStatusCb(); loadChatHistoryCb(); }, [checkAIStatusCb, loadChatHistoryCb]);

  // Hydrate last mode (dropbox vs overlay) and listen for cross-tab sync
  useEffect(() => {
    try {
      const v = sessionStorage.getItem('ai_overlay');
      if (v != null) setIsOpen(v === 'true');
      // Hydrate AI view from user preferences
      if (user?.id) {
        const prefs = PreferenceService.load(user.id);
        if (prefs.aiView === 'fullscreen') setIsFullscreenState(true);
        if (prefs.aiView === 'windowed') setIsFullscreenState(false);
      }
    } catch { /* noop */ }
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('jrmsu_ai_overlay_channel');
      ch.onmessage = (e) => { if (typeof e?.data?.open === 'boolean') setIsOpen(Boolean(e.data.open)); };
    } catch { /* noop */ }
    return () => { try { if (ch) ch.close(); } catch { /* noop */ } };
  }, []);

  // Auto-open chat if Study Helper mode enabled for students
  useEffect(() => {
    try {
      if (user?.role === 'student') {
        const dbUser = user?.id ? databaseService.getUserById(user.id) : null;
        if (dbUser?.aiMode === 'study') setIsOpen(true);
      }
    } catch { /* noop */ }
  }, [user?.id, user?.role]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreenState(next);
    try { sessionStorage.setItem('ai_fullscreen', String(next)); } catch { /* noop */ }
    try { if (user?.id) PreferenceService.save(user.id, { aiView: next ? 'fullscreen' : 'windowed' }); } catch { /* noop */ }
  };

  async function checkAIStatus() {
    const status = await aiService.checkOllamaStatus();
    setIsOnline(status);
    if (!status) {
      toast({ title: "AI Service Offline", description: "Jose is currently unavailable. Please ensure Ollama is running.", variant: "destructive" });
    }
  }

  function loadChatHistory() {
    if (!user?.id) return;
    const history = aiService.getChatHistory(user.id);
    setMessages(history.slice(-10));
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading || !user?.id) return;
    const userMessage: ChatMessage = { id: `msg_${Date.now()}_user`, role: "user", content: message, timestamp: new Date(), userId: user.id };
    setMessages(prev => [...prev, userMessage]);
    aiService.saveChatMessage(userMessage);
    setMessage("");
    setIsLoading(true);
    try {
      const response = await aiService.sendMessage(userMessage.content, user.id, messages.slice(-5));
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const err: ChatMessage = { id: `msg_${Date.now()}_error`, role: "assistant", content: "I can't connect right now. Please ensure Ollama is running.", timestamp: new Date(), userId: user!.id };
      setMessages(prev => [...prev, err]);
      toast({ title: "Connection Error", description: String(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !user?.id) return;
    setSearchResults(aiService.searchChatHistory(searchQuery, user.id));
  };

  const handleClearHistory = () => {
    if (!confirm('Clear your chat history with Jose?')) return;
    aiService.clearChatHistory(user?.id);
    setMessages([]);
    toast({ title: "Chat history cleared" });
  };

  const Header = (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"><Bot className="h-5 w-5" /></div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold">Jose</h3>
          <Badge variant="secondary" className="text-xs px-2 py-0"><span className="sr-only">AI</span><Sparkles className="h-3 w-3" /></Badge>
          <div className={`ml-2 h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Fullscreen / Overlay toggle (top-right) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title={isFullscreen ? 'Overlay size' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        {/* Exit/close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(false);
            try {
              sessionStorage.setItem('ai_overlay','false');
              const ch = new BroadcastChannel('jrmsu_ai_overlay_channel'); ch.postMessage({ open: false }); ch.close();
            } catch { /* noop */ }
          }}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Close"
        > 
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const Body = (
    <>
      <Tabs value={activeTab} onValueChange={(v: 'chat'|'history'|'search') => setActiveTab(v)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="chat" className="text-xs"><MessageCircle className="h-3 w-3 mr-1" />Chat</TabsTrigger>
          <TabsTrigger value="history" className="text-xs"><History className="h-3 w-3 mr-1" />History</TabsTrigger>
          <TabsTrigger value="search" className="text-xs"><Search className="h-3 w-3 mr-1" />Search</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Hi! I'm Jose, your JRMSU Library assistant.</p>
                  <p className="text-xs mt-1">Ask me anything about books, borrowing, or library services!</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {isLoading && (<div className="flex justify-start"><div className="bg-muted rounded-lg p-3"><Loader2 className="h-4 w-4 animate-spin" /></div></div>)}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="history" className="flex-1 flex flex-col m-0 p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4"><p className="text-sm font-medium">{messages.length} messages</p><Button variant="outline" size="sm" onClick={handleClearHistory}>Clear History</Button></div>
                  {messages.map((msg) => (
                    <Card key={msg.id} className="p-3">
                      <div className="flex items-start gap-2">
                        {msg.role === 'user' ? (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><MessageCircle className="h-3 w-3 text-primary" /></div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0"><Bot className="h-3 w-3 text-secondary" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium capitalize">{msg.role}</p>
                          <p className="text-sm mt-1 text-muted-foreground">{msg.content.substring(0, 100)}...</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground"><History className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-sm">No chat history yet</p></div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="search" className="flex-1 flex flex-col m-0 p-0">
          <div className="p-4 border-b"><div className="flex gap-2"><Input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }} /><Button onClick={handleSearch} size="icon"><Search className="h-4 w-4" /></Button></div></div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {searchResults.length > 0 ? (
                searchResults.map((msg) => (
                  <Card key={msg.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      {msg.role === 'user' ? (<MessageCircle className="h-4 w-4 text-primary mt-1" />) : (<Bot className="h-4 w-4 text-secondary mt-1" />)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium capitalize text-muted-foreground">{msg.role}</p>
                        <p className="text-sm mt-1">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground"><Search className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-sm">Search your conversations with Jose</p></div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {activeTab === 'chat' && (
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2">
            <Input placeholder="Ask Jose anything..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(); }} disabled={isLoading || !isOnline} />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !isOnline || !message.trim()}>{isLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Send className="h-4 w-4" />)}</Button>
          </div>
          {!isOnline && (<p className="text-xs text-destructive mt-2 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />AI service offline. Start Ollama to chat with Jose.</p>)}
        </div>
      )}
    </>
  );

  return (
    <div className={`fixed z-50 ${!isOpen ? 'bottom-6 right-6' : ''}`}>
      {!isOpen && (
        <Button
          size="lg"
          onClick={() => {
            setIsOpen(true);
            try {
              sessionStorage.setItem('ai_overlay','true');
              const ch = new BroadcastChannel('jrmsu_ai_overlay_channel'); ch.postMessage({ open: true }); ch.close();
            } catch { /* noop */ }
          }}
          onPointerDown={(e) => {
            try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch { /* noop */ }
            const rectSize = 64; // approx button size
            const currentX = bubblePos?.x ?? (window.innerWidth - 24 - rectSize);
            const currentY = bubblePos?.y ?? (window.innerHeight - 24 - rectSize);
            dragRef.current.dragging = true;
            dragRef.current.dx = e.clientX - currentX;
            dragRef.current.dy = e.clientY - currentY;
          }}
          onPointerMove={(e) => {
            if (!dragRef.current.dragging) return;
            const rectSize = 64;
            const x = Math.min(Math.max(e.clientX - dragRef.current.dx, 8), window.innerWidth - rectSize - 8);
            const y = Math.min(Math.max(e.clientY - dragRef.current.dy, 8), window.innerHeight - rectSize - 8);
            setBubblePos({ x, y });
          }}
          onPointerUp={() => {
            dragRef.current.dragging = false;
            try { if (bubblePos) sessionStorage.setItem('ai_bubble_pos', JSON.stringify(bubblePos)); } catch { /* noop */ }
          }}
          className={`fixed ${bubblePos ? '' : 'bottom-6 right-6'} h-16 w-16 rounded-full shadow-jrmsu-gold bg-gradient-to-br from-primary via-primary to-secondary hover:from-primary/90 hover:to-secondary/90 animate-pulse hover:animate-none transition-all`}
          style={bubblePos ? ({ left: bubblePos.x, top: bubblePos.y } as React.CSSProperties) : undefined}
          title="Expand Jose (overlay) — Ask anything..."
        >
          <span className="relative inline-flex items-center justify-center w-full h-full" aria-label="Jose">
            <Bot className="h-7 w-7 text-white drop-shadow" />
          </span>
        </Button>
      )}

      {isOpen && (
        isFullscreen ? (
          <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity">
            <Card className="w-[min(960px,95vw)] h-[90vh] rounded-xl shadow-jrmsu flex flex-col overflow-hidden transition-all duration-200 ease-out">
              {Header}
              <div className="flex-1 flex flex-col">{Body}</div>
            </Card>
          </div>
        ) : (
          <div className="fixed bottom-24 right-6 z-[70]">
            <Card className="w-[380px] max-w-[90vw] h-[520px] max-h-[80vh] rounded-xl shadow-jrmsu flex flex-col overflow-hidden transition-all duration-200 ease-out">
              {Header}
              <div className="flex-1 flex flex-col">{Body}</div>
            </Card>
          </div>
        )
      )}
    </div>
  );
};

export default AIAssistant;
