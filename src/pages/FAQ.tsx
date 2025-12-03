import { Layout } from "@/components/layout/Layout";
import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const FAQ = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              الأسئلة الشائعة
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            إجابات على الأسئلة الأكثر شيوعاً
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card border border-border/30 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-right hover:no-underline py-5">
                  <span className="font-display font-bold text-foreground text-lg">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-right leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
