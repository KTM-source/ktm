import { cn } from '@/lib/utils';
import verifiedBadge from '@/assets/verified-badge.png';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge = ({ size = 'sm', className, showTooltip = true }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div 
      className={cn("inline-flex items-center justify-center relative group", className)}
      title={showTooltip ? "حساب موثق ✓" : undefined}
    >
      <img 
        src={verifiedBadge} 
        alt="موثق" 
        className={cn(
          sizeClasses[size],
          "drop-shadow-[0_0_4px_rgba(59,130,246,0.5)] animate-pulse"
        )}
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          حساب موثق ✓
        </div>
      )}
    </div>
  );
};
