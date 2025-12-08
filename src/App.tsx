import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import LauncherWrapper from "@/components/launcher/LauncherWrapper";
import Index from "./pages/Index";
import Games from "./pages/Games";
import GameDetails from "./pages/GameDetails";
import Categories from "./pages/Categories";
import CategoryGames from "./pages/CategoryGames";
import TopGames from "./pages/TopGames";
import RecentGames from "./pages/RecentGames";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import HowToDownload from "./pages/HowToDownload";
import ContactUs from "./pages/ContactUs";
import ReportIssue from "./pages/ReportIssue";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AITrend from "./pages/AITrend";
import AICodingHome from "./pages/AICodingHome";
import AICodingProject from "./pages/AICodingProject";
import PublishedWebsite from "./pages/PublishedWebsite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Remove lovable badge
const removeBadge = () => {
  const badge = document.getElementById('lovable-badge');
  if (badge) {
    badge.remove();
  }
};

const App = () => {
  useEffect(() => {
    // Initial removal
    removeBadge();
    
    // Observer to catch dynamically added badge
    const observer = new MutationObserver(() => {
      removeBadge();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LauncherWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/games" element={<Games />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<CategoryGames />} />
                <Route path="/top-games" element={<TopGames />} />
                <Route path="/recent" element={<RecentGames />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/how-to-download" element={<HowToDownload />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={<Account />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/ktm-admin-panel" element={<Admin />} />
                <Route path="/ktm/ai/trend" element={<AITrend />} />
                <Route path="/ktm/ai/trend/:conversationId" element={<AITrend />} />
                <Route path="/ktm/ai/coding" element={<AICodingHome />} />
                <Route path="/ktm/ai/coding/:projectId" element={<AICodingProject />} />
                {/* Published Websites */}
                <Route path="/website/:username" element={<PublishedWebsite />} />
                <Route path="/website/:username/:page" element={<PublishedWebsite />} />
                {/* Game detail route - matches /game-slug-free-download */}
                <Route path="/:slug" element={<GameDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </LauncherWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;