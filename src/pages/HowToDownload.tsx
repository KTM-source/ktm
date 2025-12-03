import { Layout } from "@/components/layout/Layout";
import { Download, Search, MousePointer, FolderOpen, Play, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. ابحث عن اللعبة",
    description: "استخدم شريط البحث أو تصفح التصنيفات للعثور على اللعبة التي تريدها."
  },
  {
    icon: MousePointer,
    title: "2. افتح صفحة اللعبة",
    description: "اضغط على اللعبة لفتح صفحتها ومشاهدة التفاصيل ومتطلبات النظام."
  },
  {
    icon: Download,
    title: "3. اضغط على زر التحميل",
    description: "اضغط على زر 'تحميل اللعبة' وسيتم توجيهك لرابط التحميل المباشر."
  },
  {
    icon: FolderOpen,
    title: "4. فك الضغط",
    description: "بعد اكتمال التحميل، استخدم WinRAR أو 7-Zip لفك ضغط الملفات."
  },
  {
    icon: Play,
    title: "5. شغّل اللعبة",
    description: "افتح مجلد اللعبة وشغّل ملف .exe - اللعبة جاهزة للعب!"
  },
];

const tips = [
  "استخدم برنامج IDM لتسريع التحميل",
  "أوقف برنامج مكافحة الفيروسات مؤقتاً عند فك الضغط",
  "شغّل اللعبة كمسؤول (Run as Administrator) إذا لم تعمل",
  "تأكد من توفر مساحة كافية على القرص الصلب",
  "حدّث تعريفات كرت الشاشة لأفضل أداء",
];

const HowToDownload = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Download className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              طريقة التحميل
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            دليل خطوة بخطوة لتحميل وتشغيل الألعاب
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="glass-card p-6 flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-primary/20">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">
              💡 نصائح مهمة
            </h2>
            <ul className="space-y-4">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-center gap-3 text-right">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowToDownload;
