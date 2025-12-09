import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface LiteLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { path: "/", label: "الرئيسية" },
  { path: "/games", label: "جميع الألعاب" },
  { path: "/top-games", label: "الأكثر مشاهدة" },
  { path: "/recent", label: "الأحدث" },
  { path: "/categories", label: "التصنيفات" },
  { path: "/favorites", label: "المفضلة" },
];

export const LiteLayout = ({ children }: LiteLayoutProps) => {
  const location = useLocation();
  const { user, profile } = useAuth();

  return (
    <div className="lite-page">
      {/* Navbar */}
      <nav className="lite-navbar">
        <div className="lite-navbar-content">
          <Link to="/" className="lite-logo">
            KTM
          </Link>
          <div className="lite-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`lite-nav-link ${location.pathname === link.path ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="lite-nav-auth">
            {user ? (
              <Link to="/profile" className="lite-user-avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="lite-avatar-img" />
                ) : (
                  <div className="lite-avatar-placeholder">
                    {profile?.first_name?.charAt(0) || "U"}
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/auth" className="lite-button-small">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="lite-footer">
        <p className="lite-footer-text">
          © 2024 KTM Games. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
};
