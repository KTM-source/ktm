import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Save,
  FolderOpen,
  FileText,
  ChevronDown,
  X,
  Pencil,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const CODING_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coding-chat`;

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
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
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes code-line {
    from { width: 0; opacity: 0; }
    to { width: 100%; opacity: 1; }
  }
  
  @keyframes blink-cursor {
    0%, 50% { border-color: transparent; }
    51%, 100% { border-color: #10b981; }
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
  
  .typing-animation span {
    display: inline-block;
    animation: typing-dot 1.4s infinite;
  }
  
  .typing-animation span:nth-child(2) { animation-delay: 0.2s; }
  .typing-animation span:nth-child(3) { animation-delay: 0.4s; }
  
  .code-editor-line {
    animation: code-line 0.3s ease-out forwards;
  }
  
  .cursor-blink {
    border-right: 2px solid #10b981;
    animation: blink-cursor 1s infinite;
  }
`;

// Status indicator component with animations
const StatusIndicator = ({ action, editsCount }: { action: AIAction | null; editsCount: number }) => {
  const icons = {
    thinking: <Brain className="w-4 h-4 animate-pulse" />,
    reading: <BookOpen className="w-4 h-4 animate-pulse" />,
    editing: <Pencil className="w-4 h-4 animate-pulse" />,
    done: <Check className="w-4 h-4 text-emerald-400" />
  };

  const labels = {
    thinking: "يفكر...",
    reading: `يقرأ ${action?.file || ""}`,
    editing: `يحرر ${action?.file || ""}`,
    done: "انتهى"
  };

  const colors = {
    thinking: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    reading: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    editing: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    done: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
  };

  return (
    <div className="flex items-center gap-3">
      {editsCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium animate-slide-up">
          <Pencil className="w-3.5 h-3.5" />
          <span>{editsCount} تعديل</span>
        </div>
      )}
      {action && (
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium animate-slide-up",
          colors[action.type]
        )}>
          {icons[action.type]}
          <span>{labels[action.type]}</span>
        </div>
      )}
    </div>
  );
};

// File tab component with animations
const FileTab = ({ 
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
}) => (
  <div 
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 group",
      isActive 
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent hover:border-white/10",
      isEditing && "animate-pulse-glow"
    )}
    onClick={onClick}
  >
    <FileCode className={cn("w-4 h-4 transition-transform duration-300", isActive && "scale-110")} />
    <span className="text-sm font-medium">{file.name}</span>
    {isEditing && (
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
    )}
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-200"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

// Message component with animations
const ChatMessage = ({ message, index }: { message: Message; index: number }) => {
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
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110",
        isUser 
          ? "bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30" 
          : "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-300 hover:scale-[1.02]",
        isUser 
          ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-50 border border-emerald-500/30" 
          : "bg-white/5 text-gray-200 border border-white/10 hover:border-white/20"
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

// Typing indicator
const TypingIndicator = () => (
  <div className="flex gap-3 animate-slide-up">
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 animate-float">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
      <div className="typing-animation flex gap-1">
        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
      </div>
    </div>
  </div>
);

const AICoding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [files, setFiles] = useState<CodeFile[]>([
    { name: "index.html", content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحتي</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
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
        p {
            color: #94a3b8;
            font-size: 1.1rem;
        }
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFileIndex];

  // Load projects on mount
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

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
        // Update existing project
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
        // Create new project
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

  // Send message to AI with live editing
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setCurrentAction({ type: "thinking" });
    setEditsCount(0);

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
            ...messages.map(m => ({ role: m.role, content: m.content })),
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
              
              // Check for file being edited
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

      // Parse and apply file changes
      const { message, files: newFiles } = parseAIResponse(fullContent);

      // Apply files one by one with animation
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        setCurrentAction({ type: "editing", file: file.name });
        setEditingFile(file.name);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        addNewFile(file.name, file.content, file.language);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setEditingFile(null);
      setMessages(prev => [...prev, { role: "assistant", content: message || fullContent }]);
      setCurrentAction({ type: "done" });
      
      setTimeout(() => setCurrentAction(null), 2000);

    } catch (error) {
      console.error("Chat error:", error);
      toast({ 
        title: "حدث خطأ", 
        description: "فشل في الاتصال بالذكاء الاصطناعي",
        variant: "destructive" 
      });
      setCurrentAction(null);
    } finally {
      setIsLoading(false);
      setEditingFile(null);
    }
  };

  // Handle code changes
  const handleCodeChange = (newContent: string) => {
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
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ktm/ai/trend")}
              className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse-glow">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-transparent border-none text-lg font-bold text-white p-0 h-auto focus-visible:ring-0 w-40"
                    placeholder="اسم المشروع"
                  />
                </div>
                <p className="text-xs text-gray-400">AI-Powered Code Editor • GPT-5</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusIndicator action={currentAction} editsCount={editsCount} />
            
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
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
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
        <div className="w-[380px] border-r border-white/10 flex flex-col bg-black/20">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 animate-slide-up">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center animate-float">
                    <Sparkles className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">KTM Coding</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    اكتب طلبك وسأقوم بكتابة الكود مباشرة. أستطيع إنشاء صفحات HTML كاملة مع CSS و JavaScript.
                  </p>
                  <div className="mt-6 space-y-2">
                    {["صمم صفحة هبوط احترافية", "أضف تأثيرات أنيميشن جميلة", "سوي نموذج تواصل متكامل"].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="block w-full text-right px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} index={i} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="اكتب طلبك هنا..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50 transition-all duration-300"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor & Preview Panel */}
        <div className="flex-1 flex flex-col">
          {/* File tabs */}
          <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-black/30 overflow-x-auto">
            {files.map((file, i) => (
              <FileTab
                key={file.name}
                file={file}
                isActive={i === activeFileIndex}
                onClick={() => setActiveFileIndex(i)}
                onDelete={() => deleteFile(i)}
                isEditing={editingFile === file.name}
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const name = prompt("اسم الملف الجديد:", "page.html");
                if (name) addNewFile(name);
              }}
              className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor and Preview split */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className={cn(
              "flex flex-col border-r border-white/10 transition-all duration-500",
              isPreviewFullscreen ? "w-0 overflow-hidden" : "w-1/2"
            )}>
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">{activeFile?.name}</span>
                  {editingFile === activeFile?.name && (
                    <span className="text-xs text-amber-400 animate-pulse">يُحرَّر...</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={copyCode} className="text-gray-400 hover:text-white h-8 w-8 transition-all duration-300">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={downloadFile} className="text-gray-400 hover:text-white h-8 w-8 transition-all duration-300">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Code textarea */}
              <textarea
                ref={textareaRef}
                value={activeFile?.content || ""}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={cn(
                  "flex-1 w-full p-4 bg-[#0d1117] text-gray-300 font-mono text-sm resize-none focus:outline-none transition-all duration-300",
                  editingFile === activeFile?.name && "animate-shimmer"
                )}
                style={{ tabSize: 2 }}
                spellCheck={false}
              />
            </div>

            {/* Preview */}
            <div className={cn(
              "flex flex-col transition-all duration-500",
              isPreviewFullscreen ? "w-full" : "w-1/2"
            )}>
              {/* Preview toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Preview</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setPreviewKey(prev => prev + 1)}
                    className="text-gray-400 hover:text-white h-8 w-8 transition-all duration-300 hover:rotate-180"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                    className="text-gray-400 hover:text-white h-8 w-8 transition-all duration-300"
                  >
                    {isPreviewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Preview iframe */}
              <div className="flex-1 bg-white relative overflow-hidden">
                <iframe
                  key={previewKey}
                  srcDoc={getPreviewHTML()}
                  className="w-full h-full border-0 transition-opacity duration-300"
                  title="Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoding;
