import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  PenLine,
  BookOpen,
  Brain,
  FileEdit,
  RefreshCw,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

const CODING_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coding-chat`;

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "reading" | "editing" | "done";
}

interface AIAction {
  type: "thinking" | "reading" | "editing" | "done";
  file?: string;
  description?: string;
}

// Status indicator component
const StatusIndicator = ({ action }: { action: AIAction | null }) => {
  if (!action) return null;

  const icons = {
    thinking: <Brain className="w-4 h-4 animate-pulse" />,
    reading: <BookOpen className="w-4 h-4 animate-pulse" />,
    editing: <FileEdit className="w-4 h-4 animate-pulse" />,
    done: <Check className="w-4 h-4 text-emerald-400" />
  };

  const labels = {
    thinking: "يفكر...",
    reading: `يقرأ ${action.file || ""}`,
    editing: `يحرر ${action.file || ""}`,
    done: "انتهى"
  };

  const colors = {
    thinking: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    reading: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    editing: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    done: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium animate-fade-in",
      colors[action.type]
    )}>
      {icons[action.type]}
      <span>{labels[action.type]}</span>
    </div>
  );
};

// File tab component
const FileTab = ({ 
  file, 
  isActive, 
  onClick, 
  onDelete 
}: { 
  file: CodeFile; 
  isActive: boolean; 
  onClick: () => void;
  onDelete: () => void;
}) => (
  <div 
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
      isActive 
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
    )}
    onClick={onClick}
  >
    <FileCode className="w-4 h-4" />
    <span className="text-sm font-medium">{file.name}</span>
    {!isActive && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="ml-1 p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
);

// Message component
const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex gap-3 animate-fade-in",
      isUser ? "flex-row-reverse" : ""
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-gradient-to-br from-emerald-500 to-cyan-500" 
          : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-emerald-500/20 text-emerald-50 border border-emerald-500/30" 
          : "bg-white/5 text-gray-200 border border-white/10"
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

const AICoding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [files, setFiles] = useState<CodeFile[]>([
    { name: "index.html", content: "<!DOCTYPE html>\n<html>\n<head>\n    <title>صفحتي</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            margin: 0;\n            padding: 20px;\n            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n            min-height: 100vh;\n            color: white;\n        }\n        h1 {\n            text-align: center;\n            color: #00d9ff;\n        }\n    </style>\n</head>\n<body>\n    <h1>مرحباً بك في KTM Coding</h1>\n    <p>ابدأ بكتابة طلبك للذكاء الاصطناعي...</p>\n</body>\n</html>", language: "html" }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeFile = files[activeFileIndex];

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

  // Get combined HTML for preview
  const getPreviewHTML = () => {
    // Find index.html or use active file
    const indexFile = files.find(f => f.name === "index.html") || activeFile;
    if (!indexFile) return "";
    
    // Simple replacement for linked files
    let html = indexFile.content;
    
    // Replace CSS/JS links with inline content if we have those files
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
      // Update existing file
      const newFiles = [...files];
      newFiles[existingIndex].content = content;
      setFiles(newFiles);
      setActiveFileIndex(existingIndex);
    } else {
      // Add new file
      setFiles(prev => [...prev, { name: fileName, content, language }]);
      setActiveFileIndex(files.length);
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

      // If no filename specified, generate one
      if (!fileName) {
        if (language === "html") fileName = `page${newFiles.length + 1}.html`;
        else if (language === "css") fileName = `style${newFiles.length + 1}.css`;
        else if (language === "javascript" || language === "js") fileName = `script${newFiles.length + 1}.js`;
        else fileName = `file${newFiles.length + 1}.${language}`;
      }

      newFiles.push({ name: fileName, content, language });
      cleanMessage = cleanMessage.replace(match[0], `[تم إنشاء/تحديث ملف: ${fileName}]`);
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
    setCurrentAction({ type: "thinking" });

    try {
      // Build context with current files
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

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      setCurrentAction({ type: "reading" });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                
                // Update action based on content
                if (fullContent.includes("```")) {
                  setCurrentAction({ type: "editing", file: activeFile.name });
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Parse response for files
      const { message, files: newFiles } = parseAIResponse(fullContent);

      // Add/update files
      if (newFiles.length > 0) {
        newFiles.forEach(file => {
          addNewFile(file.name, file.content, file.language);
        });
      }

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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ktm/ai/trend")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">KTM Coding</h1>
                <p className="text-xs text-gray-400">AI-Powered Code Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentAction && <StatusIndicator action={currentAction} />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[400px] border-r border-white/10 flex flex-col bg-black/10">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">مرحباً بك في KTM Coding</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    اكتب طلبك وسأقوم بإنشاء الكود لك مباشرة. يمكنني إنشاء صفحات HTML كاملة مع CSS و JavaScript.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">جاري الكتابة...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="اكتب طلبك هنا..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
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

        {/* Editor & Preview Panel */}
        <div className="flex-1 flex flex-col">
          {/* File tabs */}
          <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-black/20 overflow-x-auto">
            {files.map((file, i) => (
              <FileTab
                key={file.name}
                file={file}
                isActive={i === activeFileIndex}
                onClick={() => setActiveFileIndex(i)}
                onDelete={() => deleteFile(i)}
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const name = prompt("اسم الملف الجديد:", "page.html");
                if (name) addNewFile(name);
              }}
              className="text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor and Preview split */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className={cn(
              "flex flex-col border-r border-white/10 transition-all duration-300",
              isPreviewFullscreen ? "w-0 overflow-hidden" : "w-1/2"
            )}>
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">{activeFile?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={copyCode} className="text-gray-400 hover:text-white h-8 w-8">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={downloadFile} className="text-gray-400 hover:text-white h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Code textarea */}
              <textarea
                value={activeFile?.content || ""}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="flex-1 w-full p-4 bg-[#0d1117] text-gray-300 font-mono text-sm resize-none focus:outline-none"
                style={{ tabSize: 2 }}
                spellCheck={false}
              />
            </div>

            {/* Preview */}
            <div className={cn(
              "flex flex-col transition-all duration-300",
              isPreviewFullscreen ? "w-full" : "w-1/2"
            )}>
              {/* Preview toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Preview</span>
                </div>
                <div className="flex items-center gap-1">
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
              
              {/* Preview iframe */}
              <div className="flex-1 bg-white">
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  srcDoc={getPreviewHTML()}
                  className="w-full h-full border-0"
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
