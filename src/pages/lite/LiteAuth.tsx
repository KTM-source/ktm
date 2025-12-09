import { useState } from "react";
import { LiteLayout } from "@/components/lite/LiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LiteAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          navigate("/");
        }
      } else {
        if (!firstName || !username) {
          toast.error("يرجى ملء جميع الحقول");
          return;
        }
        const { error } = await signUp(email, password, firstName, username);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("تم إنشاء الحساب بنجاح");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="lite-auth-card">
          <h1 className="lite-auth-title">
            {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
          </h1>

          <form onSubmit={handleSubmit} className="lite-auth-form">
            {!isLogin && (
              <>
                <div className="lite-form-group">
                  <label className="lite-label">الاسم الأول</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="lite-input"
                    placeholder="أدخل اسمك الأول"
                    required
                  />
                </div>
                <div className="lite-form-group">
                  <label className="lite-label">اسم المستخدم</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="lite-input"
                    placeholder="اختر اسم مستخدم"
                    required
                  />
                </div>
              </>
            )}

            <div className="lite-form-group">
              <label className="lite-label">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lite-input"
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="lite-form-group">
              <label className="lite-label">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lite-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="lite-button lite-button-full" disabled={isLoading}>
              {isLoading ? "جاري التحميل..." : isLogin ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <div className="lite-auth-switch">
            <span>
              {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="lite-link"
            >
              {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
          </div>
        </div>
      </section>
    </LiteLayout>
  );
};

export default LiteAuth;
