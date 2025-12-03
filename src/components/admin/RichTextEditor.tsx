import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, List, Type, Palette, Eye, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

// Parse and render rich text
export function parseRichText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) {
      return <br key={lineIndex} />;
    }

    // Check if it's a bullet point (starts with - or •)
    const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
    const lineContent = isBullet ? line.trim().substring(1).trim() : line;

    // Parse inline formatting
    const parseInline = (text: string): React.ReactNode[] => {
      const result: React.ReactNode[] = [];
      let currentIndex = 0;
      
      // Match **bold** and colored text like {red:text} or {#ff0000:text}
      const regex = /\*\*(.+?)\*\*|\{([^:}]+):([^}]+)\}/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > currentIndex) {
          result.push(text.slice(currentIndex, match.index));
        }

        if (match[1]) {
          // Bold text
          result.push(
            <strong key={`bold-${match.index}`} className="font-bold text-foreground">
              {match[1]}
            </strong>
          );
        } else if (match[2] && match[3]) {
          // Colored text
          const color = match[2].startsWith("#") ? match[2] : getColorValue(match[2]);
          result.push(
            <span key={`color-${match.index}`} style={{ color }}>
              {match[3]}
            </span>
          );
        }

        currentIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (currentIndex < text.length) {
        result.push(text.slice(currentIndex));
      }

      return result.length > 0 ? result : [text];
    };

    const parsedContent = parseInline(lineContent);

    if (isBullet) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 my-1">
          <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
          <span>{parsedContent}</span>
        </div>
      );
    }

    return (
      <p key={lineIndex} className="my-1">
        {parsedContent}
      </p>
    );
  });
}

function getColorValue(colorName: string): string {
  const colors: Record<string, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    purple: "#a855f7",
    pink: "#ec4899",
    orange: "#f97316",
    cyan: "#06b6d4",
    white: "#ffffff",
    gray: "#9ca3af",
  };
  return colors[colorName.toLowerCase()] || colorName;
}

export function RichTextEditor({ value, onChange, placeholder, rows = 6 }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById("rich-text-area") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        newText = `**${selectedText || "نص عريض"}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case "bullet":
        newText = `\n- ${selectedText || "عنصر"}`;
        cursorOffset = 3;
        break;
      case "red":
        newText = `{red:${selectedText || "نص أحمر"}}`;
        cursorOffset = selectedText ? 0 : 5;
        break;
      case "blue":
        newText = `{blue:${selectedText || "نص أزرق"}}`;
        cursorOffset = selectedText ? 0 : 6;
        break;
      case "green":
        newText = `{green:${selectedText || "نص أخضر"}}`;
        cursorOffset = selectedText ? 0 : 7;
        break;
      default:
        return;
    }

    const before = value.substring(0, start);
    const after = value.substring(end);
    onChange(before + newText + after);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 glass-card rounded-lg border border-border/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("bold")}
          className="h-8 w-8 p-0"
          title="نص عريض **text**"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("bullet")}
          className="h-8 w-8 p-0"
          title="نقطة - text"
        >
          <List className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("red")}
          className="h-8 w-8 p-0"
          title="{red:text}"
        >
          <div className="w-4 h-4 rounded-full bg-red-500" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("blue")}
          className="h-8 w-8 p-0"
          title="{blue:text}"
        >
          <div className="w-4 h-4 rounded-full bg-blue-500" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("green")}
          className="h-8 w-8 p-0"
          title="{green:text}"
        >
          <div className="w-4 h-4 rounded-full bg-green-500" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant={showPreview ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-8 gap-1"
        >
          {showPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? "تعديل" : "معاينة"}
        </Button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="min-h-[150px] p-4 glass-card rounded-lg border border-border/50 text-foreground/90 leading-relaxed">
          {parseRichText(value) || <span className="text-muted-foreground">لا يوجد محتوى</span>}
        </div>
      ) : (
        <Textarea
          id="rich-text-area"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "اكتب الوصف هنا...\n\nتنسيقات متاحة:\n**نص عريض**\n- نقطة\n{red:نص أحمر}\n{blue:نص أزرق}"}
          rows={rows}
          className="glass-card border-border/50 font-mono text-sm leading-relaxed"
          dir="auto"
        />
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        التنسيقات: <code className="px-1 py-0.5 bg-muted rounded">**عريض**</code> • 
        <code className="px-1 py-0.5 bg-muted rounded mx-1">- نقطة</code> • 
        <code className="px-1 py-0.5 bg-muted rounded">{"{color:نص}"}</code> • 
        سطر فاضي = فقرة جديدة
      </p>
    </div>
  );
}
