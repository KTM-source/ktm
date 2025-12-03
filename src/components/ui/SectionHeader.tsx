import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
  className?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  href,
  linkText = "عرض الكل",
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-end justify-between mb-8", className)}>
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group"
        >
          <span>{linkText}</span>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
};
