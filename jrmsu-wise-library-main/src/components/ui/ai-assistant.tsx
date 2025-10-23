import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/auth";
import { aiService, type ChatMessage as AIChatMessage, type AdminCommand } from "@/services/aiService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  emotion?: string;
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
  const [isOnline, setIsOnline] = useState(true);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingCommand, setPendingCommand] = useState<AdminCommand | null>(null);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = `user_${userRole}_${Date.now()}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check Ollama status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const online = await aiService.checkOllamaStatus();
      setIsOnline(online);
    };
    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load chat history and add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      // Load last 5 messages from history
      const history = aiService.getChatHistory(userId).slice(-5);
      const historyMessages: Message[] = history.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: new Date(msg.timestamp),
        emotion: msg.emotion
      }));

      const welcomeMessage: Message = {
        id: "welcome",
        content: userRole === "admin" 
          ? "Hello Admin! I'm Jose, your AI assistant. I can help you with system management, analytics insights, student queries, and navigation. How can I assist you today?"
          : "Hi there! I'm Jose, your AI study assistant. I can help you find books, answer questions about the library system, provide study tips, and guide you through the platform. What would you like to know?",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(historyMessages.length > 0 ? historyMessages : [welcomeMessage]);
    }
  }, [userRole, userId, messages.length]);

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

  // Real AI response with streaming
  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    setStreamingContent("");

    try {
      // Check if online
      if (!isOnline) {
        throw new Error("AI service is offline");
      }

      // Convert messages to AI format
      const conversationHistory: AIChatMessage[] = messages
        .filter(m => m.sender !== 'assistant' || m.id !== 'welcome')
        .map(m => ({
          id: m.id,
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
          timestamp: m.timestamp,
          userId,
          emotion: m.emotion
        }) as AIChatMessage);

      // Use streaming for real-time response
      const response = await aiService.sendMessageStream(
        userMessage,
        userId,
        conversationHistory,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      const assistantMessage: Message = {
        id: response.id,
        content: response.content,
        sender: "assistant",
        timestamp: new Date(response.timestamp),
        emotion: response.emotion
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error: any) {
      console.error('AI response error:', error);
      
      // Fallback offline message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm currently unable to connect to the AI service. Please make sure Ollama is running locally on port 11434. You can still browse books and use other features of the system.",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsOnline(false);
    } finally {
      setIsTyping(false);
    }
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
    
    // Save user message to history
    aiService.saveChatMessage({
      id: userMessage.id,
      role: 'user',
      content: userMessage.content,
      timestamp: userMessage.timestamp,
      userId
    } as AIChatMessage);

    const messageToProcess = inputValue.trim();
    setInputValue("");

    // Check for admin commands
    if (userRole === 'admin') {
      const command = aiService.detectAdminCommand(messageToProcess, userRole);
      
      if (command.type !== 'none') {
        if (command.requiresConfirmation) {
          // Show confirmation dialog
          setPendingCommand(command);
          setShowCommandDialog(true);
          
          // Add a message indicating command detected
          const commandMessage: Message = {
            id: Date.now().toString(),
            content: `🔐 Admin command detected: "${command.description}". ${command.requires2FA ? 'This requires 2FA verification. ' : ''}Please confirm to proceed.`,
            sender: "assistant",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, commandMessage]);
          return;
        } else {
          // Execute non-critical commands immediately
          await executeCommand(command);
          return;
        }
      }
    }

    // Regular AI response
    await getAIResponse(messageToProcess);
  };

  const executeCommand = async (command: AdminCommand) => {
    setIsTyping(true);
    try {
      const result = await aiService.executeAdminCommand(command, userId, false);
      
      const responseMessage: Message = {
        id: Date.now().toString(),
        content: `${result.success ? '✅' : '❌'} ${result.message}`,
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, responseMessage]);
      
      // Get AI explanation of the result
      if (result.success) {
        await getAIResponse(`Explain what this command does: ${command.description}`);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ Failed to execute command: ${error}`,
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
    <>
      {/* Admin Command Confirmation Dialog */}
      <AlertDialog open={showCommandDialog} onOpenChange={setShowCommandDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              Confirm Admin Command
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCommand && (
                <div className="space-y-2">
                  <p><strong>Command:</strong> {pendingCommand.description}</p>
                  {pendingCommand.requires2FA && (
                    <p className="text-orange-600 font-medium">
                      ⚠️ This action requires 2FA verification
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to proceed?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingCommand(null);
              const cancelMessage: Message = {
                id: Date.now().toString(),
                content: "❌ Command cancelled by user.",
                sender: "assistant",
                timestamp: new Date()
              };
              setMessages(prev => [...prev, cancelMessage]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingCommand) {
                if (pendingCommand.requires2FA) {
                  // In a real app, show 2FA dialog here
                  const twoFAMessage: Message = {
                    id: Date.now().toString(),
                    content: "🔐 2FA verification required. Please enter your code (simulated for demo).",
                    sender: "assistant",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, twoFAMessage]);
                }
                await executeCommand(pendingCommand);
                setPendingCommand(null);
              }
            }}>
              {pendingCommand?.requires2FA ? 'Verify & Execute' : 'Execute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-6 right-6 z-50">
        <Card className={`w-80 shadow-lg transition-all duration-300 ${isMinimized ? "h-14" : "h-96"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" 
                   onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Jose</CardTitle>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <Badge variant="secondary" className="text-xs">
                {userRole === "admin" ? "Admin" : "Student"}
              </Badge>
            </div>
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
                
                {/* Show streaming content */}
                {streamingContent && (
                  <div className="flex justify-start">
                    <div className="flex space-x-2 max-w-[80%]">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-sm whitespace-pre-line">
                        {streamingContent}
                        <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show typing indicator when no streaming content yet */}
                {isTyping && !streamingContent && (
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
              {!isOnline && (
                <div className="mb-2 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>Ollama offline - Limited functionality</span>
                </div>
              )}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask Jose anything..."
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
    </>
  );
}
