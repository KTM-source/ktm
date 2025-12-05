import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, Plus, Link as LinkIcon, FileArchive, FileText, File } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface AdditionalFile {
  name: string;
  url: string;
  size: number; // in bytes
}

interface FileUploadProps {
  values: AdditionalFile[];
  onChange: (files: AdditionalFile[]) => void;
  label: string;
  maxFiles?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  
  if (archiveExts.includes(ext)) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  if (docExts.includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  
  const exeExts = ['exe', 'msi', 'app', 'dmg'];
  if (exeExts.includes(ext)) {
    return (
      <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded flex items-center justify-center">
        <span className="text-[8px] font-bold text-white">EXE</span>
      </div>
    );
  }
  
  return <File className="w-5 h-5 text-primary" />;
}

function getFileExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    return ext;
  } catch {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
    return ext;
  }
}

export function FileUpload({ 
  values = [], 
  onChange, 
  label, 
  maxFiles = 10 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<AdditionalFile | null> => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 100 ميجابايت");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `additional-files/${fileName}`;

      const { data, error } = await supabase.storage
        .from("game-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("game-images")
        .getPublicUrl(data.path);

      return {
        name: file.name,
        url: publicUrl,
        size: file.size,
      };
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const remainingSlots = maxFiles - values.length;
    if (remainingSlots <= 0) {
      toast.error(`الحد الأقصى ${maxFiles} ملفات`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((file): file is AdditionalFile => file !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...values, ...successfulUploads]);
        toast.success(`تم رفع ${successfulUploads.length} ملف`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
    e.target.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  }, [values, maxFiles, onChange]);

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      toast.error("الرجاء إدخال رابط الملف");
      return;
    }

    const ext = getFileExtFromUrl(urlInput);
    const defaultName = urlName.trim() || `file.${ext || 'zip'}`;
    
    const newFile: AdditionalFile = {
      name: defaultName,
      url: urlInput.trim(),
      size: 0, // Unknown size for URL-based files
    };

    onChange([...values, newFile]);
    setUrlInput("");
    setUrlName("");
    setShowUrlInput(false);
    toast.success("تم إضافة الرابط");
  };

  const handleRemove = async (index: number) => {
    const fileToRemove = values[index];
    if (fileToRemove && fileToRemove.url.includes("game-images")) {
      try {
        const path = fileToRemove.url.split("/game-images/")[1];
        if (path) {
          await supabase.storage.from("game-images").remove([path]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center justify-between">
        {label}
        <span className="text-xs text-muted-foreground">
          {values.length}/{maxFiles}
        </span>
      </label>
      
      {/* Files List */}
      <div className="space-y-2">
        {values.map((file, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-3 glass-card rounded-lg group"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              {getFileIcon(file.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.size > 0 ? formatFileSize(file.size) : "رابط خارجي"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="w-8 h-8 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {/* URL Input */}
        {showUrlInput && (
          <div className="p-4 glass-card rounded-lg space-y-3 animate-fade-in">
            <Input
              placeholder="اسم الملف (اختياري)"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              className="bg-background/50"
            />
            <Input
              placeholder="رابط التحميل المباشر"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="bg-background/50"
              dir="ltr"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddUrl}
                className="flex-1"
              >
                إضافة
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput("");
                  setUrlName("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
        
        {/* Upload Area */}
        {values.length < maxFiles && !showUrlInput && (
          <div className="space-y-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer",
                isDragging 
                  ? "border-primary bg-primary/10 scale-[1.02]" 
                  : "border-border/50 hover:border-primary/50 hover:bg-primary/5",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className={cn(
                    "w-8 h-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    اسحب الملفات هنا أو اضغط للاختيار
                  </span>
                </>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="w-full p-3 border border-border/50 rounded-lg flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">أو أضف رابط مباشر</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}