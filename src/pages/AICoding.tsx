import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Loader2, 
  Code2, 
  Eye, 
  FileCode, 
  Plus, 
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  User,
  Brain,
  FileEdit,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Save,
  FolderOpen,
  FileText,
  ChevronDown,
  X,
  Pencil,
  BookOpen,
  Share2,
  Link,
  ExternalLink,
  Menu,
  Settings,
  Folder,
  ChevronRight,
  File as FileIcon,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CODING_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coding-chat`;

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
}

interface AIAction {
  type: "thinking" | "reading" | "editing" | "done";
  file?: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  files: CodeFile[];
  created_at: string;
  updated_at: string;
  share_id?: string;
  is_public?: boolean;
}

// CSS Animation styles
const animationStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
    50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes typing-dot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
    30% { transform: translateY(-8px); opacity: 1; }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes code-write {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes blink-cursor {
    0%, 50% { border-color: transparent; }
    51%, 100% { border-color: #10b981; }
  }
  
  @keyframes rotate-icon {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-slide-up {
    animation: slide-up 0.4s ease-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
  
  .typing-animation span {
    display: inline-block;
    animation: typing-dot 1.4s infinite;
  }
  
  .typing-animation span:nth-child(2) { animation-delay: 0.2s; }
  .typing-animation span:nth-child(3) { animation-delay: 0.4s; }
  
  .animate-rotate {
    animation: rotate-icon 1s linear infinite;
  }
  
  .code-highlight {
    transition: background-color 0.3s ease;
  }
  
  .code-highlight:hover {
    background-color: rgba(16, 185, 129, 0.1);
  }
  
  .file-item-active {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15));
    border-color: rgba(16, 185, 129, 0.4);
  }
`;

// Generate unique share ID
const generateShareId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// File sidebar item
const FileSidebarItem = ({ 
  file, 
  isActive, 
  onClick, 
  onDelete,
  isEditing
}: { 
  file: CodeFile; 
  isActive: boolean; 
  onClick: () => void;
  onDelete: () => void;
  isEditing?: boolean;
}) => {
  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.js')) return '⚡';
    return '📄';
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 group",
        isActive 
          ? "file-item-active border border-emerald-500/40 text-emerald-300" 
          : "text-gray-400 hover:bg-white/5 border border-transparent hover:text-gray-200"
      )}
      onClick={onClick}
    >
      <span className="text-sm">{getFileIcon(file.name)}</span>
      <span className="text-sm flex-1 truncate">{file.name}</span>
      {isEditing && (
        <div className="flex items-center gap-1">
          <Pencil className="w-3 h-3 text-amber-400 animate-pulse" />
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-200"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// Message component with status inside
const ChatMessage = ({ 
  message, 
  index, 
  action,
  editsCount 
}: { 
  message: Message; 
  index: number;
  action?: AIAction | null;
  editsCount?: number;
}) => {
  const isUser = message.role === "user";
  
  return (
    <div 
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : ""
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300",
        isUser 
          ? "bg-gradient-to-br from-emerald-500 to-cyan-500" 
          : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-50 border border-emerald-500/30" 
          : "bg-white/5 text-gray-200 border border-white/10"
      )}>
        {message.isThinking && action ? (
          <div className="flex items-center gap-3">
            {action.type === "thinking" && (
              <>
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">يفكر...</span>
              </>
            )}
            {action.type === "reading" && (
              <>
                <BookOpen className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm text-blue-300">يقرأ {action.file || "الملفات"}...</span>
              </>
            )}
            {action.type === "editing" && (
              <>
                <Pencil className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm text-amber-300">يحرر {action.file}...</span>
                {editsCount && editsCount > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    {editsCount} تعديل
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  );
};

// Dynamic suggestions based on context
const generateSuggestions = (lastMessage: string | undefined): string[] => {
  if (!lastMessage) {
    return [
      "صمم صفحة هبوط احترافية",
      "أضف تأثيرات أنيميشن جميلة",
      "سوي نموذج تواصل متكامل",
      "صمم قائمة تنقل متجاوبة",
      "أضف وضع ليلي/نهاري"
    ];
  }
  
  const lowerMsg = lastMessage.toLowerCase();
  
  if (lowerMsg.includes("صفحة") || lowerMsg.includes("موقع")) {
    return [
      "أضف قائمة تنقل علوية",
      "أضف تذييل للصفحة",
      "حسّن التصميم للجوال",
      "أضف أيقونات وصور",
      "أضف تأثيرات حركية"
    ];
  }
  
  if (lowerMsg.includes("أنيميشن") || lowerMsg.includes("تأثير")) {
    return [
      "أضف تأثير hover للأزرار",
      "أضف تأثير ظهور تدريجي",
      "أضف تأثير parallax",
      "أضف تأثير تموج",
      "أضف تأثير 3D"
    ];
  }
  
  if (lowerMsg.includes("نموذج") || lowerMsg.includes("فورم")) {
    return [
      "أضف validation للحقول",
      "أضف رسالة نجاح",
      "أضف أيقونات للحقول",
      "حسّن تصميم الأزرار",
      "أضف تأثيرات focus"
    ];
  }
  
  return [
    "أضف صفحة جديدة",
    "حسّن الألوان",
    "أضف المزيد من المحتوى",
    "أضف تفاعلية JavaScript",
    "حسّن SEO"
  ];
};

const AICoding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const sharedId = searchParams.get('share');
  
  // State
  const [files, setFiles] = useState<CodeFile[]>([
    { name: "index.html", content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحتي</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.05);
            border-radius: 24px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #10b981, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        p { color: #94a3b8; font-size: 1.1rem; }
        .emoji {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚀</div>
        <h1>مرحباً بك في KTM Coding</h1>
        <p>ابدأ بكتابة طلبك وسأقوم ببرمجته لك!</p>
    </div>
</body>
</html>`, language: "html" }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editsCount, setEditsCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("مشروع جديد");
  const [showProjects, setShowProjects] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showCodeView, setShowCodeView] = useState(false);
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files[activeFileIndex];

  // Load shared project
  useEffect(() => {
    if (sharedId) {
      loadSharedProject(sharedId);
    }
  }, [sharedId]);

  // Load projects on mount
  useEffect(() => {
    if (user && !sharedId) {
      loadProjects();
    }
  }, [user, sharedId]);

  // Update suggestions when messages change
  useEffect(() => {
    const lastAIMessage = messages.filter(m => m.role === "assistant" && !m.isThinking).pop();
    setSuggestions(generateSuggestions(lastAIMessage?.content));
  }, [messages]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update preview when code changes
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [activeFile?.content]);

  // Load shared project
  const loadSharedProject = async (shareId: string) => {
    const { data, error } = await supabase
      .from("coding_projects")
      .select("*")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();
    
    if (!error && data) {
      setCurrentProject({
        ...data,
        files: (data.files as unknown as CodeFile[]) || []
      });
      setProjectName(data.name);
      setFiles((data.files as unknown as CodeFile[]) || []);
      setActiveFileIndex(0);
      toast({ title: `تم تحميل مشروع "${data.name}"` });
    } else {
      toast({ title: "لم يتم العثور على المشروع", variant: "destructive" });
    }
  };

  // Load user projects
  const loadProjects = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("coding_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setProjects(data.map(p => ({
        ...p,
        files: (p.files as unknown as CodeFile[]) || []
      })));
    }
  };

  // Save current project
  const saveProject = async () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول لحفظ المشروع", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      if (currentProject) {
        const { error } = await supabase
          .from("coding_projects")
          .update({ 
            name: projectName, 
            files: JSON.parse(JSON.stringify(files)),
            updated_at: new Date().toISOString()
          })
          .eq("id", currentProject.id);

        if (error) throw error;
        toast({ title: "تم حفظ المشروع بنجاح" });
      } else {
        const { data, error } = await supabase
          .from("coding_projects")
          .insert([{
            user_id: user.id,
            name: projectName,
            files: JSON.parse(JSON.stringify(files))
          }])
          .select()
          .single();

        if (error) throw error;
        setCurrentProject({
          ...data,
          files: data.files as unknown as CodeFile[]
        });
        toast({ title: "تم إنشاء المشروع بنجاح" });
      }

      loadProjects();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "فشل في حفظ المشروع", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Share project
  const shareProject = async () => {
    if (!currentProject) {
      await saveProject();
    }
    
    if (!currentProject?.id) {
      toast({ title: "يجب حفظ المشروع أولاً", variant: "destructive" });
      return;
    }

    try {
      const shareId = currentProject.share_id || generateShareId();
      
      const { error } = await supabase
        .from("coding_projects")
        .update({ 
          share_id: shareId,
          is_public: true
        })
        .eq("id", currentProject.id);

      if (error) throw error;

      const link = `${window.location.origin}/ktm/ai/coding?share=${shareId}`;
      setShareLink(link);
      setShowShareDialog(true);
      setCurrentProject({ ...currentProject, share_id: shareId, is_public: true });
      
    } catch (error) {
      console.error("Share error:", error);
      toast({ title: "فشل في مشاركة المشروع", variant: "destructive" });
    }
  };

  // Copy share link
  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    toast({ title: "تم نسخ رابط المشاركة" });
  };

  // Load a project
  const loadProject = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setFiles(project.files.length > 0 ? project.files : [{ name: "index.html", content: "", language: "html" }]);
    setActiveFileIndex(0);
    setMessages([]);
    setShowProjects(false);
    toast({ title: `تم تحميل مشروع "${project.name}"` });
  };

  // Delete a project
  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from("coding_projects")
      .delete()
      .eq("id", projectId);

    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setProjectName("مشروع جديد");
      }
      toast({ title: "تم حذف المشروع" });
    }
  };

  // New project
  const newProject = () => {
    setCurrentProject(null);
    setProjectName("مشروع جديد");
    setFiles([{ name: "index.html", content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>صفحة جديدة</title>
</head>
<body>
    <h1>مرحباً!</h1>
</body>
</html>`, language: "html" }]);
    setActiveFileIndex(0);
    setMessages([]);
    setEditsCount(0);
    setShowProjects(false);
  };

  // Get combined HTML for preview
  const getPreviewHTML = () => {
    const indexFile = files.find(f => f.name === "index.html") || activeFile;
    if (!indexFile) return "";
    
    let html = indexFile.content;
    
    files.forEach(file => {
      if (file.name.endsWith(".css")) {
        const linkRegex = new RegExp(`<link[^>]*href=["']${file.name}["'][^>]*>`, 'gi');
        html = html.replace(linkRegex, `<style>${file.content}</style>`);
      }
      if (file.name.endsWith(".js")) {
        const scriptRegex = new RegExp(`<script[^>]*src=["']${file.name}["'][^>]*></script>`, 'gi');
        html = html.replace(scriptRegex, `<script>${file.content}</script>`);
      }
    });
    
    return html;
  };

  // Add new file
  const addNewFile = (fileName: string, content: string = "", language: string = "html") => {
    const existingIndex = files.findIndex(f => f.name === fileName);
    if (existingIndex !== -1) {
      const newFiles = [...files];
      newFiles[existingIndex].content = content;
      setFiles(newFiles);
      setActiveFileIndex(existingIndex);
      setEditsCount(prev => prev + 1);
    } else {
      setFiles(prev => [...prev, { name: fileName, content, language }]);
      setActiveFileIndex(files.length);
      setEditsCount(prev => prev + 1);
    }
  };

  // Delete file
  const deleteFile = (index: number) => {
    if (files.length <= 1) {
      toast({ title: "لا يمكن حذف الملف الوحيد", variant: "destructive" });
      return;
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(newFiles.length - 1);
    }
  };

  // Copy code
  const copyCode = async () => {
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "تم نسخ الكود" });
  };

  // Download file
  const downloadFile = () => {
    const blob = new Blob([activeFile.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `تم تحميل ${activeFile.name}` });
  };

  // Parse AI response for file operations
  const parseAIResponse = (response: string): { message: string; files: CodeFile[] } => {
    const fileMatches = response.matchAll(/```(\w+)?:?([^\n]*)\n([\s\S]*?)```/g);
    const newFiles: CodeFile[] = [];
    let cleanMessage = response;

    for (const match of fileMatches) {
      const language = match[1] || "html";
      let fileName = match[2]?.trim();
      const content = match[3]?.trim() || "";

      if (!fileName) {
        if (language === "html") fileName = `page${newFiles.length + 1}.html`;
        else if (language === "css") fileName = `style${newFiles.length + 1}.css`;
        else if (language === "javascript" || language === "js") fileName = `script${newFiles.length + 1}.js`;
        else fileName = `file${newFiles.length + 1}.${language}`;
      }

      newFiles.push({ name: fileName, content, language });
      cleanMessage = cleanMessage.replace(match[0], `✅ تم تحديث: ${fileName}`);
    }

    return { message: cleanMessage.trim(), files: newFiles };
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setIsAIEditing(true);
    setEditsCount(0);
    
    // Add thinking message
    setMessages(prev => [...prev, { role: "assistant", content: "", isThinking: true }]);
    setCurrentAction({ type: "thinking" });

    // Auto-save project on first message
    if (!currentProject && user && messages.length === 0) {
      const { data } = await supabase
        .from("coding_projects")
        .insert([{
          user_id: user.id,
          name: projectName,
          files: JSON.parse(JSON.stringify(files))
        }])
        .select()
        .single();

      if (data) {
        setCurrentProject({
          ...data,
          files: data.files as unknown as CodeFile[]
        });
        loadProjects();
      }
    }

    try {
      const filesContext = files.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n");

      const response = await fetch(CODING_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => !m.isThinking).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
          ],
          filesContext,
          currentFile: activeFile.name
        }),
      });

      if (!response.ok) {
        throw new Error("فشل الاتصال بالذكاء الاصطناعي");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      setCurrentAction({ type: "reading" });

      while (reader) {
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
              fullContent += content;
              
              const fileMatch = fullContent.match(/```(\w+)?:?([^\n]*)\n/);
              if (fileMatch) {
                const fileName = fileMatch[2]?.trim() || "ملف جديد";
                setCurrentAction({ type: "editing", file: fileName });
                setEditingFile(fileName);
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Remove thinking message
      setMessages(prev => prev.filter(m => !m.isThinking));

      // Parse and apply file changes
      const { message, files: newFiles } = parseAIResponse(fullContent);

      // Apply files one by one with animation
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        setCurrentAction({ type: "editing", file: file.name });
        setEditingFile(file.name);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        addNewFile(file.name, file.content, file.language);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setEditingFile(null);
      setMessages(prev => [...prev, { role: "assistant", content: message || fullContent }]);
      setCurrentAction({ type: "done" });
      
      setTimeout(() => setCurrentAction(null), 2000);

      // Auto-save after AI response
      if (currentProject && user) {
        await supabase
          .from("coding_projects")
          .update({ 
            files: JSON.parse(JSON.stringify(files)),
            updated_at: new Date().toISOString()
          })
          .eq("id", currentProject.id);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.filter(m => !m.isThinking));
      toast({ 
        title: "حدث خطأ", 
        description: "فشل في الاتصال بالذكاء الاصطناعي",
        variant: "destructive" 
      });
      setCurrentAction(null);
    } finally {
      setIsLoading(false);
      setIsAIEditing(false);
      setEditingFile(null);
    }
  };

  // Handle code changes
  const handleCodeChange = (newContent: string) => {
    if (isAIEditing) return; // Prevent editing while AI is working
    const newFiles = [...files];
    newFiles[activeFileIndex].content = newContent;
    setFiles(newFiles);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex items-center justify-center">
        <style>{animationStyles}</style>
        <div className="animate-float">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex flex-col">
      <style>{animationStyles}</style>
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ktm/ai/trend")}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse-glow">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-transparent border-none text-lg font-bold text-white p-0 h-auto focus-visible:ring-0 w-48"
                  placeholder="اسم المشروع"
                />
                <p className="text-xs text-gray-400">AI-Powered Code Editor • GPT-5</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Current action status */}
            {currentAction && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm animate-slide-up",
                currentAction.type === "thinking" && "bg-purple-500/20 text-purple-300 border border-purple-500/30",
                currentAction.type === "reading" && "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                currentAction.type === "editing" && "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                currentAction.type === "done" && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              )}>
                {currentAction.type === "thinking" && <Brain className="w-4 h-4 animate-pulse" />}
                {currentAction.type === "reading" && <BookOpen className="w-4 h-4 animate-pulse" />}
                {currentAction.type === "editing" && <Pencil className="w-4 h-4 animate-pulse" />}
                {currentAction.type === "done" && <Check className="w-4 h-4" />}
                <span>
                  {currentAction.type === "thinking" && "يفكر..."}
                  {currentAction.type === "reading" && `يقرأ ${currentAction.file || ""}`}
                  {currentAction.type === "editing" && `يحرر ${currentAction.file || ""}`}
                  {currentAction.type === "done" && "انتهى"}
                </span>
                {editsCount > 0 && (
                  <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full text-xs">
                    {editsCount} تعديل
                  </span>
                )}
              </div>
            )}
            
            {/* Share button */}
            <Button
              variant="ghost"
              onClick={shareProject}
              className="text-gray-400 hover:text-white gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">مشاركة</span>
            </Button>
            
            {/* Projects dropdown */}
            <DropdownMenu open={showProjects} onOpenChange={setShowProjects}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden md:inline">المشاريع</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#1a1a2e] border-white/10">
                <DropdownMenuItem onClick={newProject} className="text-emerald-400 hover:bg-emerald-500/10">
                  <Plus className="w-4 h-4 ml-2" />
                  مشروع جديد
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                {projects.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    لا توجد مشاريع محفوظة
                  </div>
                ) : (
                  projects.map(project => (
                    <DropdownMenuItem 
                      key={project.id}
                      className="flex items-center justify-between group"
                      onClick={() => loadProject(project)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-[140px]">{project.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10"
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Save button */}
            <Button
              onClick={saveProject}
              disabled={isSaving}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[350px] border-r border-white/10 flex flex-col bg-black/20">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">KTM Coder</h3>
                <p className="text-xs text-gray-400">مطور ويب محترف</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 animate-fade-in">
                  <p className="text-sm text-gray-400 mb-4">
                    اكتب طلبك وسأبرمجه لك فوراً
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage 
                  key={i} 
                  message={msg} 
                  index={i}
                  action={msg.isThinking ? currentAction : null}
                  editsCount={msg.isThinking ? editsCount : 0}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all border border-white/5 hover:border-emerald-500/30"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="اكتب طلبك هنا..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Files Sidebar */}
        <div className={cn(
          "border-r border-white/10 bg-black/30 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-48" : "w-12"
        )}>
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            </Button>
            {sidebarOpen && (
              <span className="text-xs text-gray-400 font-medium">الملفات</span>
            )}
          </div>
          
          {sidebarOpen ? (
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {files.map((file, i) => (
                  <FileSidebarItem
                    key={file.name}
                    file={file}
                    isActive={i === activeFileIndex}
                    onClick={() => setActiveFileIndex(i)}
                    onDelete={() => deleteFile(i)}
                    isEditing={editingFile === file.name}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const name = prompt("اسم الملف الجديد:", "page.html");
                  if (name) addNewFile(name);
                }}
                className="w-full mt-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 justify-start gap-2"
              >
                <Plus className="w-4 h-4" />
                ملف جديد
              </Button>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center pt-2 space-y-1">
              {files.map((file, i) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileIndex(i)}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center text-xs transition-all",
                    i === activeFileIndex 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                  title={file.name}
                >
                  {file.name.endsWith('.html') ? '🌐' : file.name.endsWith('.css') ? '🎨' : '⚡'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview & Code Panel */}
        <div className="flex-1 flex flex-col">
          {/* Tabs for Preview/Code */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeView(false)}
                className={cn(
                  "gap-2",
                  !showCodeView ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeView(true)}
                className={cn(
                  "gap-2",
                  showCodeView ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white"
                )}
              >
                <Code2 className="w-4 h-4" />
                Code
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {showCodeView && (
                <>
                  <Button variant="ghost" size="icon" onClick={copyCode} className="text-gray-400 hover:text-white h-8 w-8">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={downloadFile} className="text-gray-400 hover:text-white h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewKey(prev => prev + 1)}
                className="text-gray-400 hover:text-white h-8 w-8"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                className="text-gray-400 hover:text-white h-8 w-8"
              >
                {isPreviewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative">
            {showCodeView ? (
              <div className="absolute inset-0 bg-[#0d1117] overflow-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border-b border-white/10">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white font-medium">{activeFile?.name}</span>
                  {isAIEditing && editingFile === activeFile?.name && (
                    <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
                      <Pencil className="w-3 h-3" />
                      يُحرَّر...
                    </span>
                  )}
                </div>
                <textarea
                  value={activeFile?.content || ""}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={isAIEditing}
                  className={cn(
                    "w-full h-[calc(100%-40px)] p-4 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none",
                    isAIEditing && "opacity-70 cursor-not-allowed"
                  )}
                  spellCheck={false}
                  style={{ tabSize: 2 }}
                />
              </div>
            ) : (
              <iframe
                key={previewKey}
                srcDoc={getPreviewHTML()}
                className="w-full h-full bg-white"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              مشاركة المشروع
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              يمكن لأي شخص لديه الرابط عرض هذا المشروع
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1 bg-white/5 border-white/10 text-white text-sm"
              />
              <Button onClick={copyShareLink} className="bg-emerald-500 hover:bg-emerald-600">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 text-gray-300 hover:bg-white/5"
              onClick={() => window.open(shareLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 ml-2" />
              فتح في صفحة جديدة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICoding;
