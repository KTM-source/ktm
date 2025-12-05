import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotGalleryProps {
  screenshots: string[];
}

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  if (!screenshots || screenshots.length === 0) return null;

  const visibleCount = 3;
  const showNavigation = screenshots.length > visibleCount;
  const maxIndex = Math.max(0, screenshots.length - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setIsClosing(false);
  };

  const closeLightbox = () => {
    setIsClosing(true);
    setTimeout(() => {
      setLightboxOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const visibleScreenshots = screenshots.slice(currentIndex, currentIndex + visibleCount);

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl flex items-center gap-2">
          <ZoomIn className="w-6 h-6 text-primary" />
          صور من داخل اللعبة
        </h3>

        <div className="relative">
          {/* Navigation Arrows */}
          {showNavigation && currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {showNavigation && currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Screenshots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
            {visibleScreenshots.map((url, idx) => (
              <button
                key={currentIndex + idx}
                onClick={() => openLightbox(currentIndex + idx)}
                className="relative aspect-video rounded-xl overflow-hidden group cursor-zoom-in animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <img
                  src={url}
                  alt={`Screenshot ${currentIndex + idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 glass-card rounded-full flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Dots Indicator */}
          {showNavigation && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    idx === currentIndex 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className={cn(
            "fixed inset-0 z-50 bg-black/95 flex items-center justify-center transition-all duration-300",
            isClosing ? "opacity-0" : "opacity-100 animate-fade-in"
          )}
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Image */}
          <div 
            className={cn(
              "max-w-[90vw] max-h-[85vh] transition-all duration-300",
              isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-scale-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[lightboxIndex]}
              alt={`Screenshot ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full text-sm">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  );
}