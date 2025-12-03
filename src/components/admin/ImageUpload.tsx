import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  aspectRatio?: "portrait" | "landscape";
}

export function ImageUpload({ value, onChange, label, aspectRatio = "portrait" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة فقط");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${aspectRatio}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("game-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        toast.error("فشل في رفع الصورة");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("game-images")
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("حدث خطأ أثناء الرفع");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = async () => {
    if (value && value.includes("game-images")) {
      try {
        const path = value.split("/game-images/")[1];
        if (path) {
          await supabase.storage.from("game-images").remove([path]);
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    }
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden",
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border/50 hover:border-primary/50",
          aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-video",
          isUploading && "pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-primary/90 hover:bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  تغيير
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">جاري الرفع...</span>
              </>
            ) : (
              <>
                <div className={cn(
                  "w-16 h-16 rounded-xl glass-card flex items-center justify-center transition-transform duration-300",
                  isDragging && "scale-110"
                )}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-primary animate-bounce" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "أفلت الصورة هنا" : "اسحب الصورة هنا"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    أو اضغط لاختيار ملف
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
