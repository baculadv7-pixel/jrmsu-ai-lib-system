import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, History, Search, BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { aiService, type ChatMessage } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'search'>('chat');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI service status on mount
  useEffect(() => {
    checkAIStatus();
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAIStatus = async () => {
    const status = await aiService.checkOllamaStatus();
    setIsOnline(status);
    if (!status) {
      toast({
        title: "AI Service Offline",
        description: "Jose is currently unavailable. Please ensure Ollama is running.",
        variant: "destructive"
      });
    }
  };

  const loadChatHistory = () => {
    if (!user?.id) return;
    const history = aiService.getChatHistory(user.id);
    const recent = history.slice(-10); // Last 10 messages
    setMessages(recent);
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading || !user?.id) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: message,
      timestamp: new Date(),
      userId: user.id
    };

    setMessages(prev => [...prev, userMessage]);
    aiService.saveChatMessage(userMessage);
    setMessage("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-5);
      const response = await aiService.sendMessage(userMessage.content, user.id, conversationHistory);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please make sure Ollama is running and try again.",
        timestamp: new Date(),
        userId: user.id,
        emotion: "negative"
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Connection Error",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !user?.id) return;
    const results = aiService.searchChatHistory(searchQuery, user.id);
    setSearchResults(results);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history with Jose?')) {
      aiService.clearChatHistory(user?.id);
      setMessages([]);
      toast({ title: "Chat history cleared", description: "Your conversation with Jose has been reset." });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-[420px] h-[600px] shadow-jrmsu flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">Jose</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    <Sparkles className="h-2 w-2 mr-1" />
                    AI
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  <p className="text-xs opacity-90">{isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
              <TabsTrigger value="chat" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                Search
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
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
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium">{messages.length} messages</p>
                        <Button variant="outline" size="sm" onClick={handleClearHistory}>
                          Clear History
                        </Button>
                      </div>
                      {messages.map((msg) => (
                        <Card key={msg.id} className="p-3">
                          <div className="flex items-start gap-2">
                            {msg.role === 'user' ? (
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="h-3 w-3 text-primary" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-3 w-3 text-secondary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium capitalize">{msg.role}</p>
                              <p className="text-sm mt-1 text-muted-foreground">{msg.content.substring(0, 100)}...</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(msg.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No chat history yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="flex-1 flex flex-col m-0 p-0">
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {searchResults.length > 0 ? (
                    searchResults.map((msg) => (
                      <Card key={msg.id} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-2">
                          {msg.role === 'user' ? (
                            <MessageCircle className="h-4 w-4 text-primary mt-1" />
                          ) : (
                            <Bot className="h-4 w-4 text-secondary mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium capitalize text-muted-foreground">{msg.role}</p>
                            <p className="text-sm mt-1">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Search your conversations with Jose</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Input - Only show in Chat tab */}
          {activeTab === 'chat' && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask Jose anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                  disabled={isLoading || !isOnline}
                />
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={isLoading || !isOnline || !message.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isOnline && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  AI service offline. Start Ollama to chat with Jose.
                </p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-jrmsu-gold bg-gradient-to-br from-primary via-primary to-secondary hover:from-primary/90 hover:to-secondary/90 animate-pulse hover:animate-none transition-all"
          title="Chat with Jose"
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
};

export default AIAssistant;
