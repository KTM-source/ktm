import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Send,
  Bot,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Lock,
  TrendingUp,
  Search,
  Clock,
  Gamepad2,
  Home,
  History,
  Flame,
  Star,
  Calendar,
  ChevronRight,
  Zap,
  Bold,
  List,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  isAnimating?: boolean;
  displayedContent?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface TrendingGame {
  name: string;
  image?: string;
  genres?: string[];
  platform?: string;
  fetchedAt?: string;
}

interface TrendHistory {
  games: TrendingGame[];
  fetchedAt: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trend-chat`;

// Markdown-style content parser for rich formatting
const FormattedContent = ({ content, isAnimating }: { content: string; isAnimating?: boolean }) => {
  const formatText = (text: string) => {
    // Split into lines for processing
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Bold text: **text**
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
      
      // Bullet points: - text or • text
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        processedLine = `<span class="flex gap-2"><span class="text-emerald-400">•</span><span>${processedLine.replace(/^[-•]\s*/, '')}</span></span>`;
      }
      
      // Numbered lists: 1. text
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        processedLine = `<span class="flex gap-2"><span class="text-emerald-400 font-semibold">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></span>`;
      }
      
      // Code blocks: `code`
      processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-2 py-0.5 rounded-lg text-emerald-300 font-mono text-sm">$1</code>');
      
      // Headings: ## text
      if (line.startsWith('## ')) {
        processedLine = `<span class="text-xl font-bold text-emerald-400 block mt-4 mb-2">${line.slice(3)}</span>`;
      } else if (line.startsWith('# ')) {
        processedLine = `<span class="text-2xl font-bold text-white block mt-4 mb-2">${line.slice(2)}</span>`;
      }
      
      // Horizontal rule: ---
      if (line.trim() === '---') {
        return <hr key={lineIndex} className="border-white/10 my-4" />;
      }
      
      return (
        <span 
          key={lineIndex} 
          className="block"
          dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }}
        />
      );
    });
  };

  return (
    <div className="leading-relaxed text-lg space-y-1">
      {formatText(content)}
    </div>
  );
};

// Character-by-character animated text with proper buffering
const StreamingText = ({ 
  content, 
  onComplete 
}: { 
  content: string; 
  onComplete?: () => void;
}) => {
  const [displayedChars, setDisplayedChars] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastContentRef = useRef(content);
  
  useEffect(() => {
    // If content grew, continue animating
    if (content.length > lastContentRef.current.length) {
      lastContentRef.current = content;
    }
    
    // Animate each character
    const animate = () => {
      setDisplayedChars(prev => {
        if (prev < content.length) {
          animationRef.current = requestAnimationFrame(animate);
          return prev + 1;
        } else {
          if (onComplete) onComplete();
          return prev;
        }
      });
    };
    
    // Start animation with slight delay between chars
    const interval = setInterval(() => {
      setDisplayedChars(prev => {
        if (prev < content.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
          return prev;
        }
      });
    }, 15); // 15ms per character for smooth reveal
    
    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, onComplete]);

  const visibleContent = content.slice(0, displayedChars);
  
  return (
    <FormattedContent content={visibleContent} isAnimating={displayedChars < content.length} />
  );
};

export default function AITrend() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, profile } = useAuth();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([]);
  const [trendHistory, setTrendHistory] = useState<TrendHistory[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [trendSearchQuery, setTrendSearchQuery] = useState("");
  const [lastTrendUpdate, setLastTrendUpdate] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingConversation, setPendingConversation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check admin authentication
  useEffect(() => {
    const storedAuth = sessionStorage.getItem("ktm_admin_auth");
    if (storedAuth) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Load cached trending games and history
  useEffect(() => {
    const cached = localStorage.getItem("ktm_trending_games");
    const lastUpdate = localStorage.getItem("ktm_trending_update");
    const history = localStorage.getItem("ktm_trend_history");
    
    if (history) {
      setTrendHistory(JSON.parse(history));
    }
    
    if (cached && lastUpdate) {
      const updateTime = new Date(lastUpdate);
      const now = new Date();
      const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setTrendingGames(JSON.parse(cached));
        setLastTrendUpdate(lastUpdate);
      } else {
        // Auto-refresh after 24 hours
        fetchTrendingGames();
      }
    } else if (isAuthenticated) {
      // Auto-fetch if no games
      fetchTrendingGames();
    }
  }, [isAuthenticated]);

  // Generate suggestions based on last AI message
  useEffect(() => {
    if (messages.length > 0) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
      if (lastAssistantMsg && lastAssistantMsg.content) {
        generateSuggestions(lastAssistantMsg.content);
      }
    } else {
      setSuggestions([
        "ما هي أحدث الألعاب الترند؟",
        "أخبرني عن إحصائيات الموقع",
        "ابحث لي عن ألعاب أكشن",
        "ما الجديد في عالم الألعاب؟",
        "أريد توصيات ألعاب مغامرات",
      ]);
    }
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    }
  }, [isAuthenticated, user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setCurrentConversation(conversationId);
      fetchMessages(conversationId);
      setPendingConversation(false);
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [conversationId]);

  const generateSuggestions = async (lastMessage: string) => {
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `بناءً على هذه الرسالة: "${lastMessage.slice(0, 200)}"
ولد 5 اقتراحات قصيرة للمتابعة. كل اقتراح يكون سؤال أو طلب مختصر (أقل من 8 كلمات).
أرجع JSON فقط بهذا الشكل: ["اقتراح1", "اقتراح2", "اقتراح3", "اقتراح4", "اقتراح5"]`
          }],
          userContext: { name: "System", email: "system@ktm.com" },
        }),
      });

      if (!response.ok) return;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      const lines = fullResponse.split("\n");
      let content = "";
      
      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            content += parsed.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }

      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSuggestions(parsed.slice(0, 5));
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
    }
  };

  const generateConversationTitle = async (messages: Message[], convId: string) => {
    try {
      const lastMessages = messages.slice(-4);
      const context = lastMessages.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `بناءً على هذه المحادثة:
${context}

أنشئ عنوان قصير ومختصر (3-6 كلمات) يصف موضوع المحادثة.
أرجع العنوان فقط بدون أي علامات أو تنسيق.`
          }],
          userContext: { name: "System", email: "system@ktm.com" },
        }),
      });

      if (!response.ok) return;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      const lines = fullResponse.split("\n");
      let title = "";
      
      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            title += parsed.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }

      title = title.trim().slice(0, 50);
      if (title) {
        await supabase
          .from("ai_conversations")
          .update({ title })
          .eq("id", convId);
        
        fetchConversations();
      }
    } catch (error) {
      console.error("Error generating title:", error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        ...m,
        role: m.role as "user" | "assistant",
        isAnimating: false
      })));
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (error || !data.success) {
        toast.error("كلمة السر غير صحيحة");
        return;
      }

      setIsAuthenticated(true);
      sessionStorage.setItem("ktm_admin_auth", password);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error("حدث خطأ في تسجيل الدخول");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("ktm_admin_auth");
    navigate("/ktm-admin-panel");
  };

  // Start a new pending conversation (without creating in DB)
  const startNewConversation = () => {
    setPendingConversation(true);
    setCurrentConversation(null);
    setMessages([]);
    navigate("/ktm/ai/trend");
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;

    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", convId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversation === convId) {
        navigate("/ktm/ai/trend");
      }
      toast.success("تم حذف المحادثة");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTrendingGames = async () => {
    setIsLoadingTrends(true);
    
    try {
      // Get existing games to exclude
      const { data: existingGames } = await supabase
        .from("games")
        .select("title");
      
      const existingTitles = existingGames?.map(g => g.title.toLowerCase()) || [];
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `ابحث عن أحدث 15 لعبة ترند ومشهورة لسنة 2025 التي صدرت بالفعل وقابلة للتحميل الآن.
            
⚠️ تعليمات صارمة:
1. فقط الألعاب التي صدرت بالفعل ومتاحة للتحميل الآن
2. لا تضمن أي لعبة لم تصدر بعد مثل GTA 6 أو أي لعبة قادمة
3. استبعد هذه الألعاب: ${existingTitles.slice(0, 30).join(", ")}
4. لكل لعبة، ابحث عن رابط صورة حقيقي مباشر من:
   - Steam CDN: https://cdn.akamai.steamstatic.com/steam/apps/[APPID]/header.jpg
   - أو IGDB أو أي مصدر موثوق آخر
5. التصنيفات يجب أن تكون بالإنجليزية (Action, RPG, Adventure, etc)

أرجع JSON فقط بهذا الشكل الدقيق:
[{"name": "Game Name", "image": "https://cdn.akamai.steamstatic.com/steam/apps/XXXXX/header.jpg", "genres": ["Action", "RPG"], "platform": "PC, PS5, Xbox"}]

مهم جداً: رابط الصورة يجب أن يكون رابط مباشر يعمل وينتهي بـ .jpg أو .png`
          }],
          userContext: { name: "System", email: "system@ktm.com" },
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch trends");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      // Extract JSON from SSE response
      const lines = fullResponse.split("\n");
      let content = "";
      
      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            content += parsed.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }

      // Try to parse JSON from content
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const games: TrendingGame[] = JSON.parse(jsonMatch[0]);
        // Filter out existing games and unreleased games
        const filtered = games.filter((g: TrendingGame) => 
          !existingTitles.includes(g.name.toLowerCase()) &&
          !g.name.toLowerCase().includes("gta 6") &&
          !g.name.toLowerCase().includes("grand theft auto vi") &&
          !g.name.toLowerCase().includes("2026") &&
          !g.name.toLowerCase().includes("coming soon")
        ).slice(0, 10).map(g => ({
          ...g,
          fetchedAt: new Date().toISOString()
        }));
        
        // Save to history
        const newHistory: TrendHistory = {
          games: filtered,
          fetchedAt: new Date().toISOString()
        };
        
        const updatedHistory = [newHistory, ...trendHistory].slice(0, 30);
        setTrendHistory(updatedHistory);
        localStorage.setItem("ktm_trend_history", JSON.stringify(updatedHistory));
        
        setTrendingGames(filtered);
        localStorage.setItem("ktm_trending_games", JSON.stringify(filtered));
        localStorage.setItem("ktm_trending_update", new Date().toISOString());
        setLastTrendUpdate(new Date().toISOString());
        toast.success("تم تحديث ألعاب الترند!");
      }
    } catch (error) {
      console.error("Error fetching trends:", error);
      toast.error("حدث خطأ في جلب الألعاب");
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    let convId = currentConversation;

    // Create new conversation only on first message
    if (!convId) {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title: "محادثة جديدة" })
        .select()
        .single();

      if (error || !data) {
        toast.error("حدث خطأ في إنشاء المحادثة");
        return;
      }

      convId = data.id;
      setCurrentConversation(convId);
      setConversations(prev => [data, ...prev]);
      navigate(`/ktm/ai/trend/${convId}`, { replace: true });
      setPendingConversation(false);
    }

    setInput("");
    setIsLoading(true);

    // Add user message to UI (don't replace it)
    const userMsgId = `user-${Date.now()}`;
    const tempUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    
    // Add loading message for assistant
    const loadingMsgId = `loading-${Date.now()}`;
    const loadingMsg: Message = {
      id: loadingMsgId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      isAnimating: true,
    };
    
    setMessages(prev => [...prev, tempUserMsg, loadingMsg]);

    // Save user message to DB
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      role: "user",
      content: textToSend,
    });

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages
            .filter(m => !m.id.startsWith('loading-'))
            .map(m => ({
              role: m.role,
              content: m.content,
            })).concat([{ role: "user", content: textToSend }]),
          userContext: {
            name: profile?.first_name || "مستخدم",
            email: user.email,
            avatarUrl: profile?.avatar_url,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              // Update only the assistant message, preserve user message
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === loadingMsgId 
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch {
            // Incomplete JSON
          }
        }
      }

      // Save assistant message to DB
      await supabase
        .from("ai_messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantContent,
        });

      // Generate AI title after first exchange
      const allMessages = [...messages, tempUserMsg, { ...loadingMsg, content: assistantContent }];
      if (allMessages.filter(m => m.role === "user").length <= 2) {
        generateConversationTitle(allMessages, convId);
      }

      // Update final message state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMsgId 
            ? { ...msg, isAnimating: false }
            : msg
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMsgId 
            ? { ...msg, content: "عذراً، حدث خطأ. حاول مرة أخرى.", isAnimating: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredTrendingGames = trendingGames.filter(game =>
    game.name.toLowerCase().includes(trendSearchQuery.toLowerCase())
  );

  const allHistoryGames = trendHistory.flatMap(h => h.games);
  const uniqueHistoryGames = allHistoryGames.filter((game, index, self) =>
    index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
  );

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Sparkles className="w-10 h-10 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '0.75s' }} />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#111118]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-500/10">
            <div className="text-center mb-10">
              <div className="mx-auto w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 bg-gradient-to-br from-emerald-500 via-cyan-500 to-emerald-400 shadow-2xl shadow-emerald-500/40 animate-float">
                <img src="/favicon.png" alt="KTM" className="w-16 h-16 drop-shadow-2xl" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                KTM AI Trend
              </h1>
              <p className="text-gray-400 text-xl">مساعدك الذكي لاكتشاف الترند</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              <div className="relative group">
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-emerald-400 transition-all duration-300" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة السر"
                  className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-16 pr-14 text-xl rounded-[1.5rem] placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-emerald-500/10"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-bold text-xl rounded-[1.5rem] shadow-xl shadow-emerald-500/30 transition-all duration-500 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-6 h-6 ml-3 animate-pulse" />
                دخول
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center bg-[#111118]/60 backdrop-blur-3xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl">
          <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <img src="/favicon.png" alt="KTM" className="w-14 h-14" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">يجب تسجيل الدخول</h1>
          <p className="text-gray-400 mb-8 text-xl">سجل دخولك للوصول إلى KTM AI Trend</p>
          <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-10 py-4 text-xl rounded-[1.5rem] shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f] flex" dir="ltr">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-50 h-screen bg-[#111118]/90 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 flex flex-col overflow-hidden",
          isSidebarOpen 
            ? isSidebarCollapsed ? "w-20" : "w-80" 
            : "w-0 md:w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between min-h-[80px]">
          {(!isSidebarCollapsed && isSidebarOpen) ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <img src="/favicon.png" alt="KTM" className="w-7 h-7" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                AI Trend
              </span>
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto rounded-[1rem] bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <img src="/favicon.png" alt="KTM" className="w-7 h-7" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSidebarOpen) {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              } else {
                setIsSidebarOpen(true);
                setIsSidebarCollapsed(false);
              }
            }}
            className="hover:bg-white/5 text-gray-400 hover:text-white rounded-[0.75rem] flex-shrink-0"
          >
            {isSidebarCollapsed || !isSidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation Tabs - only show when expanded */}
        {!isSidebarCollapsed && isSidebarOpen && (
          <div className="p-4 border-b border-white/5">
            <div className="flex gap-2 bg-white/5 p-1.5 rounded-[1rem]">
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-[0.75rem] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                المحادثات
              </button>
              <button
                onClick={() => setActiveTab("trends")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-[0.75rem] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                  activeTab === "trends"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                الترند
              </button>
            </div>
          </div>
        )}

        {/* Collapsed tabs */}
        {(isSidebarCollapsed || !isSidebarOpen) && (
          <div className="p-2 border-b border-white/5 space-y-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "w-full h-12 rounded-[0.75rem]",
                activeTab === "chat" 
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("trends")}
              className={cn(
                "w-full h-12 rounded-[0.75rem]",
                activeTab === "trends" 
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={startNewConversation}
            className={cn(
              "w-full gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-[1rem] h-14 font-medium shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/40",
              (isSidebarCollapsed || !isSidebarOpen) && "justify-center p-2"
            )}
          >
            <Plus className="w-5 h-5" />
            {!isSidebarCollapsed && isSidebarOpen && "محادثة جديدة"}
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map((conv, index) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-[1rem] cursor-pointer transition-all duration-300",
                currentConversation === conv.id
                  ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30"
                  : "hover:bg-white/5"
              )}
              onClick={() => navigate(`/ktm/ai/trend/${conv.id}`)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "w-10 h-10 rounded-[0.75rem] flex items-center justify-center flex-shrink-0 transition-all duration-300",
                currentConversation === conv.id
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20"
                  : "bg-white/5"
              )}>
                <MessageSquare className="w-4 h-4" />
              </div>
              {!isSidebarCollapsed && isSidebarOpen && (
                <>
                  <span className="flex-1 truncate text-sm text-gray-300">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-9 w-9 hover:bg-red-500/10 hover:text-red-400 rounded-[0.75rem] transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-[1rem] h-12", 
              (isSidebarCollapsed || !isSidebarOpen) && "justify-center p-2"
            )}
            onClick={() => navigate("/ktm-admin-panel")}
          >
            <Home className="w-4 h-4" />
            {!isSidebarCollapsed && isSidebarOpen && "لوحة التحكم"}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-2 text-red-400 hover:bg-red-500/10 rounded-[1rem] h-12", 
              (isSidebarCollapsed || !isSidebarOpen) && "justify-center p-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && isSidebarOpen && "خروج"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Trending Games Tab Content */}
        {activeTab === "trends" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Trends Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="animate-fade-in">
                  <h1 className="text-4xl font-bold text-white flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <Flame className="w-7 h-7" />
                    </div>
                    ألعاب الترند 2025
                  </h1>
                  {lastTrendUpdate && (
                    <p className="text-gray-400 mt-3 flex items-center gap-2 mr-[4.5rem]">
                      <Clock className="w-4 h-4" />
                      آخر تحديث: {new Date(lastTrendUpdate).toLocaleString('ar-SA')}
                      <span className="text-emerald-400 text-xs">(تحديث تلقائي كل 24 ساعة)</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      value={trendSearchQuery}
                      onChange={(e) => setTrendSearchQuery(e.target.value)}
                      placeholder="ابحث في الترند..."
                      className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-14 pr-12 w-72 rounded-[1.25rem] text-lg"
                    />
                  </div>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    variant="outline"
                    className={cn(
                      "h-14 gap-2 rounded-[1.25rem] border-white/10 hover:bg-white/5",
                      showHistory && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    )}
                  >
                    <History className="w-5 h-5" />
                    {showHistory ? "إخفاء السجل" : "سجل الترند"}
                  </Button>
                </div>
              </div>

              {/* Trend History Section */}
              {showHistory && (
                <div className="mb-10 animate-fade-in">
                  <div className="bg-[#111118]/80 backdrop-blur-xl rounded-[1.5rem] border border-white/5 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-emerald-400" />
                      سجل الألعاب ({uniqueHistoryGames.length} لعبة)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {uniqueHistoryGames.slice(0, 20).map((game, i) => (
                        <div 
                          key={i} 
                          className="bg-white/5 rounded-[1rem] p-3 text-sm text-gray-300 hover:bg-white/10 transition-all duration-300"
                        >
                          {game.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Games Grid */}
              {isLoadingTrends ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
                  <p className="text-gray-400 text-lg">جاري جلب ألعاب الترند...</p>
                </div>
              ) : filteredTrendingGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTrendingGames.map((game, index) => (
                    <div
                      key={index}
                      className="group bg-[#111118]/80 backdrop-blur-xl rounded-[1.5rem] border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-video bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 relative overflow-hidden">
                        {game.image ? (
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={cn("absolute inset-0 flex items-center justify-center", game.image && "hidden")}>
                          <Gamepad2 className="w-16 h-16 text-emerald-400/30" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent opacity-60" />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Flame className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Trending</span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {game.name}
                        </h3>
                        {game.genres && game.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {game.genres.map((genre, i) => (
                              <span
                                key={i}
                                className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-500/20"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                        {game.platform && (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Gamepad2 className="w-4 h-4" />
                            {game.platform}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 mx-auto flex items-center justify-center mb-6">
                    <TrendingUp className="w-12 h-12 text-emerald-400/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">لا توجد ألعاب ترند</h3>
                  <p className="text-gray-400 mb-6">جاري جلب أحدث الألعاب تلقائياً...</p>
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab Content */}
        {activeTab === "chat" && (
          <>
            {/* Chat Header */}
            <header className="px-6 py-5 border-b border-white/5 bg-[#111118]/50 backdrop-blur-xl flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden hover:bg-white/5 rounded-[0.75rem]"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <img src="/favicon.png" alt="KTM AI" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">KTM AI Trend</h1>
                  <p className="text-sm text-gray-400">مساعدك الذكي • يتحدث جميع اللغات</p>
                </div>
              </div>

              <div className="mr-auto flex items-center gap-3">
                <span className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                  متصل
                </span>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
                  <div className="w-36 h-36 rounded-[2.5rem] bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/40 animate-float">
                    <img src="/favicon.png" alt="KTM AI" className="w-24 h-24 drop-shadow-2xl" />
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-5">
                    مرحباً بك في <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">KTM AI</span>
                  </h2>
                  <p className="text-gray-400 text-xl mb-12 leading-relaxed max-w-xl">
                    أنا مساعدك الذكي. أستطيع مساعدتك في اكتشاف الألعاب، تحليل الموقع، وأكثر من ذلك.
                    <br />أتحدث جميع اللغات وأرد بنفس لغة رسالتك!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {[
                      { icon: TrendingUp, text: "ما هي أحدث الألعاب الترند؟", color: "emerald" },
                      { icon: Search, text: "ابحث لي عن ألعاب مغامرات", color: "cyan" },
                      { icon: Sparkles, text: "ما الجديد في الموقع؟", color: "purple" },
                      { icon: Star, text: "أخبرني عن إحصائيات الموقع", color: "amber" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(item.text);
                          inputRef.current?.focus();
                        }}
                        className="group p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-500 text-right hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-[1rem] flex items-center justify-center transition-all duration-300",
                            item.color === "emerald" && "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/20",
                            item.color === "cyan" && "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-lg group-hover:shadow-cyan-500/20",
                            item.color === "purple" && "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:shadow-lg group-hover:shadow-purple-500/20",
                            item.color === "amber" && "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:shadow-lg group-hover:shadow-amber-500/20",
                          )}>
                            <item.icon className="w-7 h-7" />
                          </div>
                          <span className="text-gray-300 text-lg group-hover:text-white transition-colors">{item.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-5 animate-fade-in",
                        message.role === "user" ? "flex-row-reverse" : ""
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-[1rem] flex-shrink-0 flex items-center justify-center shadow-lg",
                        message.role === "assistant"
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/20"
                          : "bg-white/10"
                      )}>
                        {message.role === "assistant" ? (
                          <img src="/favicon.png" alt="AI" className="w-7 h-7" />
                        ) : (
                          profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="User" className="w-full h-full rounded-[1rem] object-cover" />
                          ) : (
                            <span className="text-lg font-bold">{profile?.first_name?.[0] || "U"}</span>
                          )
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex-1",
                        message.role === "user" ? "text-left" : ""
                      )}>
                        <div className={cn(
                          "rounded-[1.5rem] p-6 inline-block max-w-full",
                          message.role === "assistant"
                            ? "bg-[#111118]/80 border border-white/5 backdrop-blur-xl"
                            : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20"
                        )}>
                          {message.role === "assistant" && message.isAnimating && !message.content ? (
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-gray-400 text-sm">جاري التفكير...</span>
                            </div>
                          ) : message.role === "assistant" ? (
                            <div className="text-gray-200">
                              {message.isAnimating ? (
                                <StreamingText content={message.content} />
                              ) : (
                                <FormattedContent content={message.content} />
                              )}
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap text-lg">{message.content}</span>
                          )}
                        </div>
                        <div className={cn(
                          "text-xs text-gray-500 mt-3",
                          message.role === "user" ? "text-left" : "text-right"
                        )}>
                          {new Date(message.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && messages.length > 0 && (
              <div className="px-6 pb-2">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all duration-300 animate-fade-in flex items-center gap-2"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-[#111118]/50 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك هنا... (أتحدث جميع اللغات)"
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 h-16 pr-6 pl-20 text-lg rounded-[1.5rem] placeholder:text-gray-500 transition-all duration-300 focus:shadow-xl focus:shadow-emerald-500/10"
                    dir="auto"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-[1rem] shadow-xl shadow-emerald-500/30 disabled:opacity-50 transition-all duration-300 hover:shadow-emerald-500/50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </Button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                  KTM AI يستخدم Gemini AI • خصوصيتك محفوظة
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
