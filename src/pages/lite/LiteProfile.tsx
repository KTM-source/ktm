import { LiteLayout } from "@/components/lite/LiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { Link } from "react-router-dom";

const LiteProfile = () => {
  const { user, profile } = useAuth();
  const { stats } = useUserStats();

  if (!user) {
    return (
      <LiteLayout>
        <section className="lite-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
          <div className="lite-empty">
            <div className="lite-empty-icon">🔐</div>
            <p className="lite-empty-text">يجب تسجيل الدخول لعرض الملف الشخصي</p>
            <Link to="/auth" className="lite-button" style={{ marginTop: "1rem", display: "inline-block" }}>
              تسجيل الدخول
            </Link>
          </div>
        </section>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        {/* Profile Header */}
        <div className="lite-profile-header">
          <div className="lite-profile-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" />
            ) : (
              <div className="lite-profile-avatar-placeholder">
                {profile?.first_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="lite-profile-info">
            <h1 className="lite-profile-name">
              {profile?.first_name} {profile?.last_name || ""}
            </h1>
            <p className="lite-profile-username">@{profile?.username}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lite-stats-grid">
          <div className="lite-stat-card">
            <div className="lite-stat-value">{stats?.games_viewed || 0}</div>
            <div className="lite-stat-label">ألعاب تمت مشاهدتها</div>
          </div>
          <div className="lite-stat-card">
            <div className="lite-stat-value">{stats?.games_downloaded || 0}</div>
            <div className="lite-stat-label">تنزيلات</div>
          </div>
          <div className="lite-stat-card">
            <div className="lite-stat-value">{stats?.favorites_count || 0}</div>
            <div className="lite-stat-label">المفضلة</div>
          </div>
          <div className="lite-stat-card">
            <div className="lite-stat-value">{stats?.streak_days || 0}</div>
            <div className="lite-stat-label">أيام متتالية</div>
          </div>
        </div>

        {/* Actions */}
        <div className="lite-profile-actions">
          <Link to="/account" className="lite-button">
            إعدادات الحساب
          </Link>
          <Link to="/favorites" className="lite-button-outline">
            المفضلة
          </Link>
        </div>
      </section>
    </LiteLayout>
  );
};

export default LiteProfile;
