// AI Service - Jose Integration
// Handles communication with Ollama LLaMA 3 model


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: string;
  userId?: string;
  sessionId?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface AdminCommand {
  type: 'backup' | 'report' | 'qr_regenerate' | 'show_overdue' | 'analytics' | 'none';
  parameters?: Record<string, any>;
  requiresConfirmation: boolean;
  requires2FA: boolean;
  description: string;
}

const OLLAMA_BASE_URL = 'http://localhost:11434';
const BACKEND_AI_BASE = (import.meta as any).env?.VITE_AI_API_BASE as string | undefined;
const MODEL_NAME = 'llama3:8b-instruct-q4_K_M';
const CHAT_HISTORY_KEY = 'jrmsu_ai_chat_history';
const CHAT_SESSIONS_KEY = 'jrmsu_ai_chat_sessions';
const OPT_OUT_KEY = 'jrmsu_ai_opt_out';

// System prompt for Jose
const JOSE_SYSTEM_PROMPT = `You are Jose, the AI assistant for the JRMSU (Jose Rizal Memorial State University) Library System.

Your role:
- Help students and staff with library-related questions
- Assist with book searches and recommendations
- Provide information about library policies and procedures
- Guide users through the system features
- Be friendly, professional, and helpful

Guidelines:
- Keep responses concise and clear
- Use a warm, approachable tone
- If you don't know something, admit it and offer alternatives
- Respect user privacy and data security
- Never perform actions without user confirmation

Remember: You represent JRMSU's commitment to excellent library services.`;

class AIService {
  private currentSessionId: string | null = null;


  // Initialize session
  initSession(userId: string): string {
    this.currentSessionId = `session_${userId}_${Date.now()}`;
    return this.currentSessionId;
  }

  // Check if AI backend/Ollama is running
  async checkOllamaStatus(): Promise<boolean> {
    try {
      if (BACKEND_AI_BASE) {
        const response = await fetch(`${BACKEND_AI_BASE}/health`);
        return response.ok;
      }
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('AI status check failed:', error);
      return false;
    }
  }

  // Send message to Ollama
  async sendMessage(
    userMessage: string,
    userId: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      // Check Ollama status
      const isOnline = await this.checkOllamaStatus();
      if (!isOnline) {
        throw new Error('AI service is currently offline. Please try again later.');
      }

      // Build conversation context
      const messages = [
        { role: 'system', content: JOSE_SYSTEM_PROMPT },
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Call backend (preferred) or Ollama API
      const response = await (async () => {
        if (BACKEND_AI_BASE) {
          const token = localStorage.getItem('auth_token') || '';
          return fetch(`${BACKEND_AI_BASE}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              message: userMessage,
              history: conversationHistory.map(msg => ({ role: msg.role, content: msg.content }))
            })
          });
        }
        return fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: messages,
            stream: false
          })
        });
      })();

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const content: string = (data as any).message?.content ?? (data as any).content ?? '';
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        userId,
        sessionId: this.currentSessionId || undefined
      };

      // Analyze emotion from both user and assistant message
      const userEmotion = await this.analyzeEmotion(userMessage);
      const assistantEmotion = await this.analyzeEmotion(data.message.content);
      assistantMessage.emotion = assistantEmotion.emotion;

      // Save to history
      this.saveChatMessage(assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }

  // Send message with streaming (real-time typing effect)
  async sendMessageStream(
    userMessage: string,
    userId: string,
    conversationHistory: ChatMessage[] = [],
    onChunk: (chunk: string) => void
  ): Promise<ChatMessage> {
    try {
      const isOnline = await this.checkOllamaStatus();
      if (!isOnline) {
        throw new Error('AI service is currently offline.');
      }

      const messages = [
        { role: 'system', content: JOSE_SYSTEM_PROMPT },
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Prefer backend proxy if configured (non-streaming fallback)
      const response = await (async () => {
        if (BACKEND_AI_BASE) {
          await this.ensureAuthToken(userId, 'user');
          const token = localStorage.getItem('auth_token') || '';
          return fetch(`${BACKEND_AI_BASE}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              message: userMessage,
              history: conversationHistory.map(msg => ({ role: msg.role, content: msg.content }))
            })
          });
        }
        return fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: messages,
            stream: true
          })
        });
      })();

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      let fullContent = '';

      if (!BACKEND_AI_BASE) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  fullContent += data.message.content;
                  onChunk(data.message.content);
                }
              } catch {}
            }
          }
        }
      } else {
        const data = await response.json();
        fullContent = (data as any).content ?? '';
        if (fullContent) onChunk(fullContent);
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        userId,
        sessionId: this.currentSessionId || undefined
      };

      const emotion = await this.analyzeEmotion(fullContent);
      assistantMessage.emotion = emotion.emotion;
      this.saveChatMessage(assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  // Analyze emotion from text (Enhanced)
  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    const lowerText = text.toLowerCase();
    
    // Enhanced emotion keywords
    const emotions = {
      joy: ['happy', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'excited', 'delighted', 'pleased', 'glad', 'cheerful'],
      gratitude: ['thank', 'thanks', 'appreciate', 'grateful', 'thankful'],
      sadness: ['sad', 'unhappy', 'depressed', 'miserable', 'disappointed', 'dejected'],
      anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated'],
      fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'concerned'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'wow'],
      confusion: ['confused', 'puzzled', 'unclear', 'uncertain', "don't understand"],
      neutral: ['okay', 'fine', 'alright', 'sure', 'yes', 'no']
    };

    // Punctuation indicators
    const hasExclamation = text.includes('!');
    const hasQuestion = text.includes('?');
    const hasMultipleExclamations = (text.match(/!/g) || []).length > 1;

    // Calculate emotion scores
    const scores: Record<string, number> = {};
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      scores[emotion] = keywords.filter(word => lowerText.includes(word)).length;
    }

    // Add bonus for punctuation
    if (hasMultipleExclamations) {
      scores.joy = (scores.joy || 0) + 0.5;
      scores.excitement = (scores.excitement || 0) + 0.5;
    }

    // Find dominant emotion
    const maxScore = Math.max(...Object.values(scores));
    const dominantEmotion = Object.keys(scores).find(key => scores[key] === maxScore) || 'neutral';

    // Determine tone
    const positiveEmotions = ['joy', 'gratitude', 'surprise'];
    const negativeEmotions = ['sadness', 'anger', 'fear'];
    
    let tone: 'positive' | 'negative' | 'neutral';
    if (positiveEmotions.includes(dominantEmotion)) {
      tone = 'positive';
    } else if (negativeEmotions.includes(dominantEmotion)) {
      tone = 'negative';
    } else {
      tone = 'neutral';
    }

    const confidence = maxScore > 0 ? Math.min(0.5 + (maxScore * 0.15), 0.95) : 0.6;

    return {
      emotion: dominantEmotion,
      confidence,
      tone
    };
  }

  // Adjust response tone based on user emotion
  getResponseTonePrompt(userEmotion: EmotionAnalysis): string {
    switch (userEmotion.tone) {
      case 'positive':
        return 'The user seems happy and positive. Match their enthusiasm and be encouraging.';
      case 'negative':
        return 'The user seems frustrated or upset. Be empathetic, patient, and offer helpful solutions.';
      case 'neutral':
      default:
        return 'Maintain a friendly, professional tone.';
    }
  }

  // Save chat message to localStorage (respects opt-out)
  saveChatMessage(message: ChatMessage): void {
    try {
      const optedOut = localStorage.getItem(OPT_OUT_KEY) === 'true';
      if (optedOut) return;
      const history = this.getChatHistory();
      history.push(message);
      // Keep only last 100 messages
      const trimmedHistory = history.slice(-100);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  }

  // Get chat history (respects opt-out)
  getChatHistory(userId?: string): ChatMessage[] {
    try {
      const optedOut = localStorage.getItem(OPT_OUT_KEY) === 'true';
      if (optedOut) return [];
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      if (!raw) return [];
      const history = JSON.parse(raw) as ChatMessage[];
      // Filter by userId if provided
      if (userId) {
        return history.filter(msg => msg.userId === userId);
      }
      return history;
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  // Clear chat history
  clearChatHistory(userId?: string): void {
    if (userId) {
      const history = this.getChatHistory();
      const filtered = history.filter(msg => msg.userId !== userId);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }

  // Search in chat history (respects opt-out)
  searchChatHistory(query: string, userId?: string): ChatMessage[] {
    const history = this.getChatHistory(userId);
    const lowerQuery = query.toLowerCase();
    
    return history.filter(msg =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  // Get book recommendations (integration with book service)
  async getBookRecommendations(query: string, userId: string): Promise<string> {
    const prompt = `Based on the user's interest in "${query}", recommend 3-5 books from our library. 
    Consider popular books in related categories. Format your response as a friendly recommendation list.`;
    
    const response = await this.sendMessage(prompt, userId, []);
    return response.content;
  }

  // Generate report summary
  async generateReportSummary(reportType: string, data: any): Promise<string> {
    const prompt = `Generate a concise summary for a ${reportType} report with the following data: ${JSON.stringify(data)}. 
    Keep it brief and highlight key insights.`;
    
    const response = await this.sendMessage(prompt, 'admin', []);
    return response.content;
  }

  // Detect admin commands from user message
  detectAdminCommand(message: string, userRole: string): AdminCommand {
    if (userRole !== 'admin') {
      return {
        type: 'none',
        requiresConfirmation: false,
        requires2FA: false,
        description: 'Not an admin user'
      };
    }

    const lowerMessage = message.toLowerCase();

    // Backup command
    if (lowerMessage.includes('backup') && (lowerMessage.includes('database') || lowerMessage.includes('db'))) {
      return {
        type: 'backup',
        parameters: { includeAI: lowerMessage.includes('ai') || lowerMessage.includes('all') },
        requiresConfirmation: true,
        requires2FA: true,
        description: 'Backup database to file'
      };
    }

    // Report generation
    if ((lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('show')) && 
        (lowerMessage.includes('report') || lowerMessage.includes('summary'))) {
      let reportType = 'daily';
      if (lowerMessage.includes('weekly')) reportType = 'weekly';
      if (lowerMessage.includes('monthly')) reportType = 'monthly';
      if (lowerMessage.includes('yearly')) reportType = 'yearly';
      
      return {
        type: 'report',
        parameters: { 
          reportType,
          format: lowerMessage.includes('pdf') ? 'pdf' : lowerMessage.includes('excel') ? 'excel' : 'summary'
        },
        requiresConfirmation: false,
        requires2FA: false,
        description: `Generate ${reportType} report`
      };
    }

    // QR code regeneration
    if ((lowerMessage.includes('regenerate') || lowerMessage.includes('rebuild')) && 
        lowerMessage.includes('qr')) {
      return {
        type: 'qr_regenerate',
        parameters: { all: lowerMessage.includes('all') },
        requiresConfirmation: true,
        requires2FA: true,
        description: 'Regenerate QR codes'
      };
    }

    // Show overdue books
    if (lowerMessage.includes('overdue') || (lowerMessage.includes('late') && lowerMessage.includes('book'))) {
      return {
        type: 'show_overdue',
        parameters: {},
        requiresConfirmation: false,
        requires2FA: false,
        description: 'Show overdue books'
      };
    }

    // Analytics/Statistics
    if ((lowerMessage.includes('show') || lowerMessage.includes('display')) && 
        (lowerMessage.includes('stat') || lowerMessage.includes('analytic') || lowerMessage.includes('metric'))) {
      return {
        type: 'analytics',
        parameters: {
          timeframe: lowerMessage.includes('today') ? 'today' : 
                    lowerMessage.includes('week') ? 'week' : 
                    lowerMessage.includes('month') ? 'month' : 'today'
        },
        requiresConfirmation: false,
        requires2FA: false,
        description: 'Display system analytics'
      };
    }

    return {
      type: 'none',
      requiresConfirmation: false,
      requires2FA: false,
      description: 'No command detected'
    };
  }

  // Execute admin command (requires external handlers)
  async executeAdminCommand(
    command: AdminCommand, 
    userId: string, 
    twoFAVerified: boolean = false
  ): Promise<{ success: boolean; message: string; data?: any }> {
    // Verify 2FA if required
    if (command.requires2FA && !twoFAVerified) {
      return {
        success: false,
        message: 'This command requires 2FA verification. Please verify your identity first.'
      };
    }

    try {
      switch (command.type) {
        case 'report':
          return {
            success: true,
            message: `Generating ${command.parameters?.reportType} report...`,
            data: {
              reportType: command.parameters?.reportType,
              status: 'generating',
              estimatedTime: '30 seconds'
            }
          };

        case 'show_overdue':
          // This would call BorrowService to get overdue books
          return {
            success: true,
            message: 'Fetching overdue books...',
            data: {
              action: 'query_overdue',
              status: 'ready'
            }
          };

        case 'analytics':
          return {
            success: true,
            message: `Displaying ${command.parameters?.timeframe} analytics...`,
            data: {
              timeframe: command.parameters?.timeframe,
              status: 'ready'
            }
          };

        case 'backup':
          return {
            success: true,
            message: 'Database backup initiated. This may take a few minutes...',
            data: {
              status: 'started',
              includeAI: command.parameters?.includeAI
            }
          };

        case 'qr_regenerate':
          return {
            success: true,
            message: 'QR code regeneration started...',
            data: {
              scope: command.parameters?.all ? 'all' : 'updated',
              status: 'processing'
            }
          };

        default:
          return {
            success: false,
            message: 'Unknown command type'
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Command execution failed: ${error.message}`
      };
    }
  }

  // Opt-out controls
  setOptOutLogging(value: boolean): void {
    localStorage.setItem(OPT_OUT_KEY, value ? 'true' : 'false');
  }
  getOptOutLogging(): boolean {
    return localStorage.getItem(OPT_OUT_KEY) === 'true';
  }
}

// Export singleton instance
export const aiService = new AIService();
