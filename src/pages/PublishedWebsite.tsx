import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

const PublishedWebsite = () => {
  const { username, page } = useParams();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      loadWebsite();
    }
  }, [username, page]);

  const loadWebsite = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("published_websites")
      .select("*")
      .eq("username", username)
      .single();

    if (fetchError || !data) {
      setError("لم يتم العثور على الموقع");
      setIsLoading(false);
      return;
    }

    const websiteFiles = (data.files as unknown as CodeFile[]) || [];
    setFiles(websiteFiles);
    setIsLoading(false);
  };

  const getPageContent = () => {
    if (files.length === 0) return "";
    
    // Determine which file to show
    const pageName = page ? `${page}.html` : "index.html";
    const targetFile = files.find(f => f.name === pageName) || files.find(f => f.name === "index.html");
    
    if (!targetFile) return "";
    
    let html = targetFile.content;
    
    // Inline CSS and JS files
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
    
    // Add base styling for full page
    if (!html.includes('<style>body{')) {
      html = html.replace('</head>', `<style>body{margin:0;min-height:100vh;}</style></head>`);
    }
    
    return html;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <p className="text-gray-400">الرابط الذي أدخلته غير صحيح أو أن الموقع لم يعد متاحاً</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={getPageContent()}
      className="w-full h-screen border-0"
      title="Published Website"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default PublishedWebsite;