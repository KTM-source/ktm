import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Bug, Send, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const issueTypes = [
  { value: "broken-link", label: "رابط تحميل لا يعمل" },
  { value: "game-crash", label: "اللعبة لا تعمل" },
  { value: "missing-files", label: "ملفات ناقصة" },
  { value: "virus-warning", label: "تحذير فيروس" },
  { value: "other", label: "مشكلة أخرى" },
];

const ReportIssue = () => {
  const [gameTitle, setGameTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameTitle || !issueType || !description) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("تم إرسال البلاغ بنجاح! شكراً لمساعدتنا في تحسين الموقع.");
    setGameTitle("");
    setIssueType("");
    setDescription("");
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bug className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              الإبلاغ عن مشكلة
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ساعدنا في تحسين الموقع بالإبلاغ عن أي مشاكل تواجهك
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Notice */}
          <div className="glass-card p-4 mb-8 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                قبل الإبلاغ، تأكد من أن جهازك يستوفي متطلبات اللعبة وجرّب الحلول في صفحة الأسئلة الشائعة.
              </p>
            </div>
          </div>

          {/* Report Form */}
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  اسم اللعبة
                </label>
                <Input
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="أدخل اسم اللعبة"
                  className="text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  نوع المشكلة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {issueTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setIssueType(type.value)}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        issueType === type.value
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/30 hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  وصف المشكلة
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل... (ما الذي حدث؟ متى ظهرت المشكلة؟)"
                  rows={5}
                  className="text-right"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                <Send className="w-4 h-4 ml-2" />
                {isSubmitting ? "جاري الإرسال..." : "إرسال البلاغ"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportIssue;
