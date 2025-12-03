import { Link } from "react-router-dom";
import { Gamepad2, Github, Twitter, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-card/50 backdrop-blur-xl mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <span className="font-display text-xl font-bold gradient-text">GameVault</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              وجهتك الأولى لتحميل أحدث الألعاب. نقدم لك مكتبة ضخمة من الألعاب المجانية مع تحديثات مستمرة.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-300">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/games" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  كل الألعاب
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link to="/top-games" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  الأكثر شعبية
                </Link>
              </li>
              <li>
                <Link to="/recent" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  آخر التحديثات
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">الدعم</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  الأسئلة الشائعة
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  طريقة التحميل
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  تواصل معنا
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  الإبلاغ عن مشكلة
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 GameVault. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};
