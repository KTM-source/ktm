import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Code2, 
  Trash2,
  Loader2,
  Search,
  Sparkles,
  FolderOpen,
  Clock,
  ArrowLeft,
  Globe,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Project {
  id: string;
  name: string;
  files: any[];
  created_at: string;
  updated_at: string;
  share_id?: string;
  is_public?: boolean;
}

const animationStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.3); }
    50% { box-shadow: 0 0 60px rgba(16, 185, 129, 0.5); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 8s ease infinite;
  }
  
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .animate-slide-up {
    animation: slide-up 0.5s ease-out forwards;
  }
  
  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }
`;

const AICodingHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [newProjectPrompt, setNewProjectPrompt] = useState("");

  useEffect(() => {
    if (user) {
      loadProjects();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const loadProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("coding_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setProjects(data.map(p => ({
        ...p,
        files: (p.files as unknown as any[]) || []
      })));
    }
    setIsLoading(false);
  };

  const createNewProject = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("coding_projects")
      .insert([{
        user_id: user.id,
        name: "مشروع جديد",
        files: [{
          name: "index.html",
          content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحتي</title>
</head>
<body>
    <h1>مرحباً بك!</h1>
</body>
</html>`,
          language: "html"
        }]
      }])
      .select()
      .single();

    if (!error && data) {
      navigate(`/ktm/ai/coding/${data.id}`);
    } else {
      toast({ title: "فشل في إنشاء المشروع", variant: "destructive" });
    }
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;
    
    const { error } = await supabase
      .from("coding_projects")
      .delete()
      .eq("id", projectToDelete);

    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
      toast({ title: "تم حذف المشروع بنجاح" });
    }
    setProjectToDelete(null);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "اليوم";
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
    return date.toLocaleDateString("ar-SA");
  };

  if (authLoading || isLoading) {
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
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ktm/ai/trend")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">KTM Coding</h1>
                <p className="text-sm text-gray-400">AI-Powered IDE</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={createNewProject}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30 gap-2"
          >
            <Plus className="w-5 h-5" />
            مشروع جديد
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              لديك فكرة؟ حولها لموقع!
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            اكتب وصف موقعك وسيقوم الذكاء الاصطناعي ببرمجته لك في ثوانٍ
          </p>
          
          {/* Quick Start Input */}
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-2 flex items-center gap-2">
              <Input
                value={newProjectPrompt}
                onChange={(e) => setNewProjectPrompt(e.target.value)}
                placeholder="صف موقعك... مثال: موقع محفظة شخصية بتصميم عصري"
                className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 text-lg h-14 focus-visible:ring-0"
              />
              <Button
                onClick={createNewProject}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl gap-2"
              >
                <Sparkles className="w-5 h-5" />
                ابدأ
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        {user && (
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                مشاريعي
              </h3>
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث..."
                  className="w-64 bg-white/5 border-white/10 text-white pr-10 placeholder:text-gray-500"
                />
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">لا توجد مشاريع بعد</p>
                <Button
                  onClick={createNewProject}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 gap-2"
                >
                  <Plus className="w-5 h-5" />
                  أنشئ مشروعك الأول
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, i) => (
                  <div
                    key={project.id}
                    className="project-card group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    onClick={() => navigate(`/ktm/ai/coding/${project.id}`)}
                  >
                    {/* Preview */}
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                      <iframe
                        srcDoc={project.files?.[0]?.content || "<html><body></body></html>"}
                        className="w-full h-full pointer-events-none scale-[0.5] origin-top-left"
                        style={{ width: '200%', height: '200%' }}
                        title="Preview"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {project.is_public && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center gap-1 text-emerald-400 text-xs">
                          <Globe className="w-3 h-3" />
                          منشور
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-white mb-1 truncate">{project.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(project.updated_at)}</span>
                        <span className="text-gray-700">•</span>
                        <span>{project.files?.length || 0} ملفات</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm text-white hover:bg-red-500/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="text-center py-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="max-w-md mx-auto bg-white/5 rounded-2xl border border-white/10 p-8">
              <Sparkles className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">سجل دخولك لحفظ مشاريعك</h3>
              <p className="text-gray-400 mb-6">يمكنك إنشاء وحفظ مشاريع غير محدودة مجاناً</p>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 gap-2"
              >
                تسجيل الدخول
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">حذف المشروع؟</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              سيتم حذف هذا المشروع نهائياً ولا يمكن استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProject}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AICodingHome;