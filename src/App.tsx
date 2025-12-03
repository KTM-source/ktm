import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/ktm-admin-panel" element={<Admin />} />
          {/* Game detail route - matches /game-slug-free-download */}
          <Route path="/:slug" element={<GameDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
