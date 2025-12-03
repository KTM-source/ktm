import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, Gamepad2, Home, Grid3X3, TrendingUp, Clock, List } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/games", label: "كل الألعاب", icon: List },
  { href: "/categories", label: "التصنيفات", icon: Grid3X3 },
  { href: "/top-games", label: "الأكثر شعبية", icon: TrendingUp },
  { href: "/recent", label: "آخر التحديثات", icon: Clock },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary transition-all duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">GameVault</span>
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
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center relative">
            <Search className="absolute right-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن لعبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-64 pr-10 text-right"
              dir="rtl"
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="pt-4 space-y-2">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن لعبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-full pr-10 text-right"
                dir="rtl"
              />
            </div>

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
          </div>
        </div>
      </div>
    </nav>
  );
};
