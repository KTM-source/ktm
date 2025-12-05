import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X, Gamepad2, Home, Grid3X3, TrendingUp, Clock, List, ChevronDown, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "All Games", icon: List },
  { href: "/top-games", label: "Top Games", icon: TrendingUp },
  { href: "/recent", label: "Recent", icon: Clock },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { categories } = useGames();
  const { user, profile, loading } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-background/90 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary transition-all duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display text-2xl font-black gradient-text tracking-wider">KTM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "nav-link flex items-center gap-2 text-sm font-medium",
                    isActive && "active"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            
            {/* Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className={cn(
                  "nav-link flex items-center gap-2 text-sm font-medium",
                  location.pathname.startsWith("/categories") && "active"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                Categories
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  showCategories && "rotate-180"
                )} />
              </button>
              
              {showCategories && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-background/95 backdrop-blur-xl rounded-xl border border-border/50 py-2 animate-scale-in origin-top-left shadow-xl z-[100]">
                  <Link
                    to="/categories"
                    onClick={() => setShowCategories(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    All Categories
                  </Link>
                  <div className="h-px bg-border/30 my-2" />
                  <div className="max-h-64 overflow-y-auto">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => setShowCategories(false)}
                        className={cn(
                          "flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors",
                          location.pathname === `/categories/${cat.slug}` && "text-primary bg-primary/10"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                        {cat.count > 0 && (
                          <span className="text-xs text-muted-foreground">{cat.count}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar + Account */}
          <div className="hidden lg:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-64 pl-10"
              />
            </form>

            {/* Account Button */}
            {!loading && (
              user ? (
                <Link
                  to="/account"
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/50 overflow-hidden flex items-center justify-center group-hover:border-primary transition-colors">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Account */}
            {!loading && (
              user ? (
                <Link
                  to="/account"
                  className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary/50 overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="p-2 rounded-lg bg-primary text-primary-foreground"
                >
                  <LogIn className="w-5 h-5" />
                </Link>
              )
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isOpen ? "max-h-[80vh] pb-4" : "max-h-0"
          )}
        >
          <div className="pt-4 space-y-2">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-full pl-10"
              />
            </form>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Categories */}
            <div>
              <button
                onClick={() => setShowMobileCategories(!showMobileCategories)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300",
                  location.pathname.startsWith("/categories")
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Grid3X3 className="w-5 h-5" />
                  Categories
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  showMobileCategories && "rotate-180"
                )} />
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                showMobileCategories ? "max-h-96" : "max-h-0"
              )}>
                <div className="pl-8 pr-4 py-2 space-y-1">
                  <Link
                    to="/categories"
                    onClick={() => { setIsOpen(false); setShowMobileCategories(false); }}
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      onClick={() => { setIsOpen(false); setShowMobileCategories(false); }}
                      className={cn(
                        "block px-4 py-2 text-sm rounded-lg transition-colors",
                        location.pathname === `/categories/${cat.slug}`
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
