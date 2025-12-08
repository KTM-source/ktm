import { ReactNode, useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { QuickActions } from "./QuickActions";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const checkElectron = () => {
      const electron = !!(window as any).electronAPI?.isElectron;
      setIsElectron(electron);
    };
    checkElectron();
    const timer = setTimeout(checkElectron, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <ParticleBackground />
      <AnnouncementBanner />
      <Navbar />
      <main className={`relative z-10 pb-20 md:pb-0 flex-1 ${isElectron ? 'pt-36' : 'pt-16'}`}>{children}</main>
      <Footer />
      <QuickActions />
    </div>
  );
};