import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/auth";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface AIAssistantProps {
  userRole: UserRole;
  currentPage?: string;
}

export function AIAssistant({ userRole, currentPage }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message based on role
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: userRole === "admin" 
          ? "Hello Admin! I'm your AI assistant. I can help you with system management, analytics insights, student queries, and navigation. How can I assist you today?"
          : "Hi there! I'm your AI study assistant. I can help you find books, answer questions about the library system, provide study tips, and guide you through the platform. What would you like to know?",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [userRole, messages.length]);

  const getContextualSuggestions = () => {
    const adminSuggestions = [
      "Show me today's library statistics",
      "How do I generate monthly reports?",
      "Help me manage student accounts",
      "Show system health status"
    ];

    const studentSuggestions = [
      "Help me find books on programming",
      "When are my books due?",
      "How do I reserve a book?",
      "Show me my borrowing history"
    ];

    return userRole === "admin" ? adminSuggestions : studentSuggestions;
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = userRole === "admin" ? {
      statistics: "📊 Here are today's key metrics:\n• Active Users: 156\n• Books Borrowed: 23\n• Overdue Items: 5\n• New Registrations: 8",
      reports: "📈 You can generate reports from the Reports section. Go to Admin > Reports and select your desired timeframe and format (PDF/Excel).",
      students: "👥 To manage students, navigate to Student Management. You can register new students, edit existing accounts, or deactivate inactive ones.",
      health: "✅ System Status: All services running normally\n• Database: Connected\n• Authentication: Active\n• Backup: Last run 2 hours ago"
    } : {
      books: "📚 I can help you search for programming books! Try using the Book Inventory with filters like 'Programming', 'Computer Science', or specific languages like 'Python' or 'JavaScript'.",
      due: "⏰ You can check your due dates in your Dashboard or Borrow/Return History. If you need to renew books, look for the renew button next to each item.",
      reserve: "📖 To reserve a book: Go to Book Inventory, find your book, and click 'Reserve' if it's currently borrowed. You'll get notified when it's available!",
      history: "📋 Your complete borrowing history is available in the 'Borrow/Return History' section. You can see all past transactions, return dates, and fees if any."
    };

    const responseKey = Object.keys(responses).find(key => 
      userMessage.toLowerCase().includes(key) || 
      userMessage.toLowerCase().includes(responses[key as keyof typeof responses].toLowerCase().split(' ')[0])
    );

    const response = responseKey 
      ? responses[responseKey as keyof typeof responses]
      : "I understand you're asking about library services. Could you be more specific? I can help with book searches, account management, system navigation, or general questions.";

    const assistantMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: "assistant",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = inputValue.trim();
    setInputValue("");

    await simulateAIResponse(messageToProcess);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = getContextualSuggestions();

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-80 shadow-lg transition-all duration-300 ${isMinimized ? "h-14" : "h-96"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" 
                   onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Assistant</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {userRole === "admin" ? "Admin Mode" : "Study Helper"}
            </Badge>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}>
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex space-x-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user" ? "bg-primary" : "bg-secondary"
                      }`}>
                        {message.sender === "user" ? (
                          <User className="h-3 w-3 text-primary-foreground" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-2 text-sm whitespace-pre-line ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex space-x-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setInputValue(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}