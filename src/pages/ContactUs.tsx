import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Send, Twitter, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("تم إرسال رسالتك بنجاح! سنرد عليك قريباً.");
    setName("");
    setEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              تواصل معنا
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            لديك سؤال أو اقتراح؟ نحن هنا للمساعدة!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="glass-card p-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              أرسل رسالة
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  الاسم
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 text-right">
                  الرسالة
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
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
                {isSubmitting ? "جاري الإرسال..." : "إرسال"}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-foreground mb-4">
                طرق التواصل الأخرى
              </h3>
              <div className="space-y-4">
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-primary/20 transition-colors group"
                >
                  <Twitter className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">
                    تابعنا على تويتر
                  </span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-primary/20 transition-colors group"
                >
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">
                    انضم لقروب الديسكورد
                  </span>
                </a>
                <a
                  href="mailto:support@ktm.com"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-primary/20 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">
                    support@ktm.com
                  </span>
                </a>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-foreground mb-4">
                ⏰ وقت الرد
              </h3>
              <p className="text-muted-foreground text-sm">
                نرد على الرسائل خلال 24-48 ساعة. للأسئلة الشائعة، راجع صفحة الأسئلة الشائعة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
