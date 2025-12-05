import { cn } from '@/lib/utils';

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
      <svg
        viewBox="0 0 24 24"
        className={cn(
          sizeClasses[size],
          "drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
        )}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer hexagon with gradient */}
        <defs>
          <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        
        {/* Badge shape - hexagonal star */}
        <path
          d="M12 2L14.5 4.5L18 4L19 7.5L22 10L20.5 13L22 16L19 18.5L18 22L14.5 21L12 24L9.5 21L6 22L5 18.5L2 16L3.5 13L2 10L5 7.5L6 4L9.5 4.5L12 2Z"
          fill="url(#verifiedGradient)"
          stroke="url(#innerGlow)"
          strokeWidth="0.5"
        />
        
        {/* Inner circle */}
        <circle
          cx="12"
          cy="13"
          r="6"
          fill="url(#innerGlow)"
          opacity="0.3"
        />
        
        {/* Checkmark */}
        <path
          d="M8 13L11 16L16 10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          حساب موثق ✓
        </div>
      )}
    </div>
  );
};
