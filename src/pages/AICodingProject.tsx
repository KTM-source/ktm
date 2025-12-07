import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
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
  ArrowLeft,
  Maximize2,
  Minimize2,
  Save,
  X,
  Pencil,
  BookOpen,
  Share2,
  RefreshCw,
  FileArchive,
  Globe,
  ChevronDown,
  ChevronRight,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  line?: number;
}

// Animation styles
const animationStyles = `
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); } 50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes typing-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.3; } 30% { transform: translateY(-8px); opacity: 1; } }
  @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes line-highlight { 0%, 100% { background-color: rgba(16, 185, 129, 0.15); } 50% { background-color: rgba(16, 185, 129, 0.3); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
  .animate-pulse-glow { animation: pulse-glow 2s infinite; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
  .typing-animation span { display: inline-block; animation: typing-dot 1.4s infinite; }
  .typing-animation span:nth-child(2) { animation-delay: 0.2s; }
  .typing-animation span:nth-child(3) { animation-delay: 0.4s; }
  .line-editing { animation: line-highlight 1s ease-in-out infinite; border-left: 3px solid #10b981 !important; }
  .editing-cursor { animation: blink 0.8s infinite; }
`;

// Generate suggestions based on context
const generateSuggestions = (lastMessage?: string): string[] => {
  if (!lastMessage) {
    return ["صمم صفحة هبوط احترافية", "أضف تأثيرات أنيميشن جميلة", "سوي نموذج تواصل", "صمم قائمة تنقل", "أضف وضع ليلي"];
  }
  const lowerMsg = lastMessage.toLowerCase();
  if (lowerMsg.includes("صفحة") || lowerMsg.includes("موقع")) {
    return ["أضف قائمة تنقل علوية", "أضف تذييل للصفحة", "حسّن للجوال", "أضف أيقونات", "أضف تأثيرات حركية"];
  }
  if (lowerMsg.includes("أنيميشن") || lowerMsg.includes("تأثير")) {
    return ["أضف تأثير hover", "أضف ظهور تدريجي", "أضف parallax", "أضف تأثير تموج", "أضف 3D"];
  }
  return ["أضف صفحة جديدة", "حسّن الألوان", "أضف محتوى", "أضف JavaScript", "حسّن SEO"];
};

const AICodingProject = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [files, setFiles] = useState<CodeFile[]>([{ name: "index.html", content: `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n    <meta charset="UTF-8">\n    <title>صفحتي</title>\n</head>\n<body>\n    <h1>مرحباً!</h1>\n</body>\n</html>`, language: "html" }]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editsCount, setEditsCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [projectName, setProjectName] = useState("مشروع جديد");
  const [isSaving, setIsSaving] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Dialogs
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showDeleteFileDialog, setShowDeleteFileDialog] = useState<number | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [publishUsername, setPublishUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files[activeFileIndex];

  // Load project on mount
  useEffect(() => {
    if (projectId && user) {
      loadProject();
    }
  }, [projectId, user]);

  // Update suggestions
  useEffect(() => {
    const lastAIMessage = messages.filter(m => m.role === "assistant" && !m.isThinking).pop();
    setSuggestions(generateSuggestions(lastAIMessage?.content));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { setPreviewKey(prev => prev + 1); }, [activeFile?.content]);

  // Check username availability
  useEffect(() => {
    if (!publishUsername.trim()) {
      setIsUsernameAvailable(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const { data } = await supabase.rpc('is_website_username_available', { check_username: publishUsername.toLowerCase() });
      setIsUsernameAvailable(data === true);
      setIsCheckingUsername(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [publishUsername]);

  // Load project
  const loadProject = async () => {
    if (!projectId || !user) return;
    
    const { data, error } = await supabase
      .from("coding_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    
    if (error || !data) {
      toast({ title: "لم يتم العثور على المشروع", variant: "destructive" });
      navigate("/ktm/ai/coding");
      return;
    }
    
    setProjectName(data.name);
    setFiles((data.files as unknown as CodeFile[]) || []);
    
    // Check if published
    const { data: publishedData } = await supabase
      .from("published_websites")
      .select("username")
      .eq("project_id", projectId)
      .single();
    
    if (publishedData) {
      setPublishedUrl(`${window.location.origin}/website/${publishedData.username}`);
    }
  };

  // Save project
  const saveProject = async () => {
    if (!user || !projectId) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("coding_projects")
      .update({ name: projectName, files: JSON.parse(JSON.stringify(files)), updated_at: new Date().toISOString() })
      .eq("id", projectId);
    
    if (error) {
      toast({ title: "فشل في الحفظ", variant: "destructive" });
    } else {
      toast({ title: "تم الحفظ" });
    }
    setIsSaving(false);
  };

  // Get preview HTML
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
    if (!fileName.trim()) return;
    const existingIndex = files.findIndex(f => f.name === fileName);
    if (existingIndex !== -1) {
      const newFiles = [...files];
      newFiles[existingIndex].content = content;
      setFiles(newFiles);
      setActiveFileIndex(existingIndex);
    } else {
      setFiles(prev => [...prev, { name: fileName, content, language }]);
      setActiveFileIndex(files.length);
    }
    setEditsCount(prev => prev + 1);
    setShowNewFileDialog(false);
    setNewFileName("");
  };

  // Delete file
  const deleteFile = (index: number) => {
    if (files.length <= 1) {
      toast({ title: "لا يمكن حذف الملف الوحيد", variant: "destructive" });
      return;
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (activeFileIndex >= newFiles.length) setActiveFileIndex(newFiles.length - 1);
    setShowDeleteFileDialog(null);
  };

  // Copy code
  const copyCode = async () => {
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as ZIP
  const exportAsZip = async () => {
    const zip = new JSZip();
    files.forEach(file => { zip.file(file.name, file.content); });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم التصدير كـ ZIP" });
  };

  // Publish website
  const publishWebsite = async () => {
    if (!user || !projectId || !publishUsername.trim() || !isUsernameAvailable) return;
    
    setIsPublishing(true);
    
    // First save the project
    await saveProject();
    
    // Check if already published
    const { data: existingPublish } = await supabase
      .from("published_websites")
      .select("id")
      .eq("project_id", projectId)
      .single();
    
    if (existingPublish) {
      // Update existing
      const { error } = await supabase
        .from("published_websites")
        .update({ username: publishUsername.toLowerCase(), files: JSON.parse(JSON.stringify(files)), updated_at: new Date().toISOString() })
        .eq("id", existingPublish.id);
      
      if (error) {
        toast({ title: "فشل في النشر", variant: "destructive" });
        setIsPublishing(false);
        return;
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("published_websites")
        .insert([{ project_id: projectId, user_id: user.id, username: publishUsername.toLowerCase(), files: JSON.parse(JSON.stringify(files)) }]);
      
      if (error) {
        toast({ title: "فشل في النشر", variant: "destructive" });
        setIsPublishing(false);
        return;
      }
    }
    
    const url = `${window.location.origin}/website/${publishUsername.toLowerCase()}`;
    setPublishedUrl(url);
    setShowPublishDialog(false);
    setShowShareDialog(true);
    toast({ title: "تم نشر الموقع بنجاح!" });
    setIsPublishing(false);
  };

  // Parse AI response
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

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setIsAIEditing(true);
    setEditsCount(0);
    
    setMessages(prev => [...prev, { role: "assistant", content: "", isThinking: true }]);
    setCurrentAction({ type: "thinking" });

    try {
      const filesContext = files.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n");

      const response = await fetch(CODING_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [...messages.filter(m => !m.isThinking).map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMessage }],
          filesContext,
          currentFile: activeFile.name
        }),
      });

      if (!response.ok) throw new Error("فشل الاتصال");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let lineCount = 0;

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
              lineCount += (content.match(/\n/g) || []).length;
              
              const fileMatch = fullContent.match(/```(\w+)?:?([^\n]*)\n/);
              if (fileMatch) {
                const fileName = fileMatch[2]?.trim() || "ملف جديد";
                setCurrentAction({ type: "editing", file: fileName, line: lineCount });
                setEditingFile(fileName);
                setEditingLine(lineCount);
              }
            }
          } catch { }
        }
      }

      setMessages(prev => prev.filter(m => !m.isThinking));
      const { message, files: newFiles } = parseAIResponse(fullContent);

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        setCurrentAction({ type: "editing", file: file.name });
        setEditingFile(file.name);
        await new Promise(resolve => setTimeout(resolve, 200));
        addNewFile(file.name, file.content, file.language);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setEditingFile(null);
      setEditingLine(null);
      setMessages(prev => [...prev, { role: "assistant", content: message || fullContent }]);
      setCurrentAction({ type: "done" });
      setTimeout(() => setCurrentAction(null), 2000);

      // Auto-save
      if (projectId && user) {
        await supabase.from("coding_projects").update({ files: JSON.parse(JSON.stringify(files)), updated_at: new Date().toISOString() }).eq("id", projectId);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.filter(m => !m.isThinking));
      toast({ title: "حدث خطأ", variant: "destructive" });
      setCurrentAction(null);
    } finally {
      setIsLoading(false);
      setIsAIEditing(false);
      setEditingFile(null);
      setEditingLine(null);
    }
  };

  // Handle code change
  const handleCodeChange = (newContent: string) => {
    if (isAIEditing) return;
    const newFiles = [...files];
    newFiles[activeFileIndex].content = newContent;
    setFiles(newFiles);
  };

  // Get file icon
  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.js')) return '⚡';
    return '📄';
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex items-center justify-center">
        <style>{animationStyles}</style>
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/ktm/ai/coding")} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="bg-transparent border-none text-lg font-bold text-white p-0 h-auto focus-visible:ring-0 w-48" />
                <p className="text-xs text-gray-400">GPT-5 Powered</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentAction && (
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm animate-slide-up",
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
                  {currentAction.type === "reading" && "يقرأ..."}
                  {currentAction.type === "editing" && `يحرر ${currentAction.file || ""}`}
                  {currentAction.type === "done" && "انتهى"}
                </span>
                {editsCount > 0 && <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full text-xs">{editsCount}</span>}
              </div>
            )}
            
            <Button variant="ghost" onClick={exportAsZip} className="text-gray-400 hover:text-white gap-2">
              <FileArchive className="w-4 h-4" />
              <span className="hidden md:inline">ZIP</span>
            </Button>
            
            <Button variant="ghost" onClick={() => publishedUrl ? setShowShareDialog(true) : setShowPublishDialog(true)} className="text-gray-400 hover:text-white gap-2">
              {publishedUrl ? <Share2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              <span className="hidden md:inline">{publishedUrl ? "مشاركة" : "نشر"}</span>
            </Button>
            
            <Button onClick={saveProject} disabled={isSaving} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-2" />حفظ</>}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[320px] border-r border-white/10 flex flex-col bg-black/20">
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

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 animate-slide-up">
                  <p className="text-sm text-gray-400">اكتب طلبك وسأبرمجه لك فوراً</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3 animate-slide-up", msg.role === "user" ? "flex-row-reverse" : "")} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", msg.role === "user" ? "bg-gradient-to-br from-emerald-500 to-cyan-500" : "bg-gradient-to-br from-purple-500 to-pink-500")}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", msg.role === "user" ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-50 border border-emerald-500/30" : "bg-white/5 text-gray-200 border border-white/10")}>
                    {msg.isThinking && currentAction ? (
                      <div className="flex items-center gap-2">
                        {currentAction.type === "thinking" && <><Brain className="w-4 h-4 text-purple-400 animate-pulse" /><span className="text-sm text-purple-300">يفكر...</span></>}
                        {currentAction.type === "reading" && <><BookOpen className="w-4 h-4 text-blue-400 animate-pulse" /><span className="text-sm text-blue-300">يقرأ...</span></>}
                        {currentAction.type === "editing" && <><Pencil className="w-4 h-4 text-amber-400 animate-pulse" /><span className="text-sm text-amber-300">يحرر {currentAction.file}...</span></>}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all border border-white/5 hover:border-emerald-500/30">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder="اكتب طلبك..." className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500" disabled={isLoading} />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-emerald-500 to-cyan-500">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview & Code Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCodeView(false)} className={cn("gap-2", !showCodeView ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white")}>
                <Eye className="w-4 h-4" />Preview
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCodeView(true)} className={cn("gap-2", showCodeView ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white")}>
                <Code2 className="w-4 h-4" />Code
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {showCodeView && (
                <>
                  <Button variant="ghost" size="icon" onClick={copyCode} className="text-gray-400 hover:text-white h-8 w-8">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { const blob = new Blob([activeFile.content], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = activeFile.name; a.click(); }} className="text-gray-400 hover:text-white h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => setPreviewKey(p => p + 1)} className="text-gray-400 hover:text-white h-8 w-8">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)} className="text-gray-400 hover:text-white h-8 w-8">
                {isPreviewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Code View with File Sidebar */}
            {showCodeView ? (
              <div className="flex-1 flex">
                {/* File Sidebar inside Code tab */}
                <div className={cn("border-r border-white/10 bg-[#0d1117] flex flex-col transition-all", sidebarOpen ? "w-48" : "w-12")}>
                  <div className="p-2 border-b border-white/10 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white h-8 w-8">
                      {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    </Button>
                    {sidebarOpen && <span className="text-xs text-gray-500">الملفات</span>}
                  </div>
                  
                  <ScrollArea className="flex-1">
                    {sidebarOpen ? (
                      <div className="p-2 space-y-1">
                        {files.map((file, i) => (
                          <div key={file.name} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group", i === activeFileIndex ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:bg-white/5")} onClick={() => setActiveFileIndex(i)}>
                            <span className="text-sm">{getFileIcon(file.name)}</span>
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            {editingFile === file.name && <Pencil className="w-3 h-3 text-amber-400 animate-pulse" />}
                            <button onClick={(e) => { e.stopPropagation(); setShowDeleteFileDialog(i); }} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setShowNewFileDialog(true)} className="w-full mt-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 justify-start gap-2">
                          <Plus className="w-4 h-4" />ملف جديد
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center pt-2 space-y-1">
                        {files.map((file, i) => (
                          <button key={file.name} onClick={() => setActiveFileIndex(i)} className={cn("w-8 h-8 rounded flex items-center justify-center text-xs", i === activeFileIndex ? "bg-emerald-500/20 text-emerald-400" : "text-gray-500 hover:text-gray-300")} title={file.name}>
                            {getFileIcon(file.name)}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Code Editor */}
                <div className="flex-1 bg-[#0d1117] overflow-auto">
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border-b border-white/10">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white font-medium">{activeFile?.name}</span>
                    {isAIEditing && editingFile === activeFile?.name && (
                      <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
                        <Pencil className="w-3 h-3" />يُحرَّر...
                        {editingLine && <span className="text-gray-500">سطر {editingLine}</span>}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      ref={codeRef}
                      value={activeFile?.content || ""}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      disabled={isAIEditing}
                      className={cn("w-full min-h-[calc(100vh-180px)] p-4 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none", isAIEditing && "opacity-70 cursor-not-allowed")}
                      spellCheck={false}
                      style={{ tabSize: 2 }}
                    />
                    {isAIEditing && editingFile === activeFile?.name && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="animate-pulse bg-emerald-500/5 h-6 w-full" style={{ marginTop: `${(editingLine || 1) * 24}px` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Preview */
              <iframe key={previewKey} srcDoc={getPreviewHTML()} className="w-full h-full bg-white" title="Preview" sandbox="allow-scripts allow-same-origin" />
            )}
          </div>
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400" />ملف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="اسم الملف (مثال: page.html)" className="bg-white/5 border-white/10 text-white" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewFileDialog(false)} className="flex-1 border-white/10 text-gray-300">إلغاء</Button>
              <Button onClick={() => addNewFile(newFileName)} disabled={!newFileName.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-600">إنشاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <AlertDialog open={showDeleteFileDialog !== null} onOpenChange={() => setShowDeleteFileDialog(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">حذف الملف؟</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">سيتم حذف هذا الملف نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteFileDialog !== null && deleteFile(showDeleteFileDialog)} className="bg-red-500 hover:bg-red-600">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-400" />نشر الموقع</DialogTitle>
            <DialogDescription className="text-gray-400">اختر اسم مستخدم لرابط موقعك</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-white/10">
                <span className="text-gray-500 text-sm">ktm.lovable.app/website/</span>
                <Input value={publishUsername} onChange={(e) => setPublishUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="username" className="flex-1 bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0" />
                {isCheckingUsername ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : isUsernameAvailable === true ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : isUsernameAvailable === false ? (
                  <X className="w-4 h-4 text-red-400" />
                ) : null}
              </div>
              {isUsernameAvailable === false && <p className="text-xs text-red-400">هذا الاسم غير متاح</p>}
              {isUsernameAvailable === true && <p className="text-xs text-emerald-400">متاح!</p>}
            </div>
            <Button onClick={publishWebsite} disabled={!publishUsername.trim() || !isUsernameAvailable || isPublishing} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Globe className="w-4 h-4 ml-2" />نشر الموقع</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Share2 className="w-5 h-5 text-emerald-400" />مشاركة الموقع</DialogTitle>
            <DialogDescription className="text-gray-400">موقعك منشور ويمكن لأي شخص زيارته</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={publishedUrl || ""} readOnly className="flex-1 bg-white/5 border-white/10 text-white text-sm" />
              <Button onClick={() => { navigator.clipboard.writeText(publishedUrl || ""); toast({ title: "تم النسخ" }); }} className="bg-emerald-500 hover:bg-emerald-600">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:bg-white/5" onClick={() => window.open(publishedUrl || "", '_blank')}>
              فتح الموقع
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICodingProject;