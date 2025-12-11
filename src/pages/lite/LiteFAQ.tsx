import { LiteLayout } from "@/components/lite/LiteLayout";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "كيف أقوم بتحميل الألعاب؟",
    answer: "اختر اللعبة التي تريدها، ثم اضغط على زر التحميل في صفحة اللعبة. سيتم توجيهك لرابط التحميل المباشر."
  },
  {
    question: "هل الألعاب آمنة للتحميل؟",
    answer: "نعم، جميع الألعاب مفحوصة ونظيفة من الفيروسات. نحن نحرص على توفير ملفات آمنة 100%."
  },
  {
    question: "ماذا تعني Pre-Installed؟",
    answer: "الألعاب Pre-Installed تعني أنها جاهزة للعب مباشرة بعد فك الضغط، لا تحتاج تثبيت."
  },
  {
    question: "ما هي متطلبات النظام؟",
    answer: "كل لعبة لها متطلبات مختلفة. يمكنك رؤية المتطلبات في صفحة كل لعبة تحت قسم 'متطلبات النظام'."
  },
  {
    question: "لماذا التحميل بطيء؟",
    answer: "سرعة التحميل تعتمد على سرعة الإنترنت لديك. جرب استخدام برنامج تحميل مثل IDM لتسريع التحميل."
  },
  {
    question: "اللعبة لا تعمل، ماذا أفعل؟",
    answer: "تأكد من أن جهازك يستوفي متطلبات اللعبة، وجرب تشغيل اللعبة كمسؤول (Run as Administrator). إذا استمرت المشكلة، أبلغنا عنها."
  },
  {
    question: "هل يمكنني طلب لعبة معينة؟",
    answer: "نعم! يمكنك التواصل معنا عبر صفحة 'تواصل معنا' وطلب اللعبة التي تريدها."
  },
  {
    question: "كيف أفك الضغط عن الملفات؟",
    answer: "استخدم برنامج WinRAR أو 7-Zip لفك الضغط. اضغط بزر الماوس الأيمن على الملف واختر 'Extract Here'."
  },
];

const LiteFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LiteLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              الأسئلة الشائعة
            </h1>
          </div>
          <p className="text-muted-foreground">
            إجابات على الأسئلة الأكثر شيوعاً
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="lite-card rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-5 flex items-center justify-between text-right"
              >
                <span className="font-bold text-foreground text-lg">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 text-muted-foreground text-right border-t border-border/30 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </LiteLayout>
  );
};

export default LiteFAQ;
