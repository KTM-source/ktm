import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Bug, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const issueTypes = [
  { value: "broken-link", label: "رابط تحميل لا يعمل" },
  { value: "game-crash", label: "اللعبة لا تعمل" },
  { value: "missing-files", label: "ملفات ناقصة" },
  { value: "virus-warning", label: "تحذير فيروس" },
  { value: "other", label: "مشكلة أخرى" },
];

const ReportIssue = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !gameTitle || !issueType || !description) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reports").insert({
        full_name: fullName,
        email: email,
        game_name: gameTitle,
        issue_type: issueType,
        description: description,
      });

      if (error) throw error;

      toast.success("تم إرسال البلاغ بنجاح! شكراً لمساعدتنا في تحسين الموقع.");
      setFullName("");
      setEmail("");
      setGameTitle("");
      setIssueType("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 text-right">
                    الاسم الكامل *
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className="text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 text-right">
                    البريد الإلكتروني *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  اسم اللعبة *
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
                  نوع المشكلة *
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
                  وصف المشكلة *
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