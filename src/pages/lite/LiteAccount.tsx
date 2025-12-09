import { LiteLayout } from "@/components/lite/LiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const LiteAccount = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) {
    return (
      <LiteLayout>
        <section className="lite-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
          <div className="lite-empty">
            <div className="lite-empty-icon">🔐</div>
            <p className="lite-empty-text">يجب تسجيل الدخول للوصول للإعدادات</p>
            <Link to="/auth" className="lite-button" style={{ marginTop: "1rem", display: "inline-block" }}>
              تسجيل الدخول
            </Link>
          </div>
        </section>
      </LiteLayout>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <h1 className="lite-page-title">إعدادات الحساب</h1>

        {/* Account Info */}
        <div className="lite-account-section">
          <h2>معلومات الحساب</h2>
          <div className="lite-account-field">
            <span className="lite-field-label">الاسم الأول</span>
            <span className="lite-field-value">{profile?.first_name || "-"}</span>
          </div>
          <div className="lite-account-field">
            <span className="lite-field-label">الاسم الأخير</span>
            <span className="lite-field-value">{profile?.last_name || "-"}</span>
          </div>
          <div className="lite-account-field">
            <span className="lite-field-label">اسم المستخدم</span>
            <span className="lite-field-value">@{profile?.username}</span>
          </div>
          <div className="lite-account-field">
            <span className="lite-field-label">البريد الإلكتروني</span>
            <span className="lite-field-value">{user.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="lite-account-actions">
          <button onClick={handleSignOut} className="lite-button-danger">
            تسجيل الخروج
          </button>
        </div>
      </section>
    </LiteLayout>
  );
};

export default LiteAccount;
