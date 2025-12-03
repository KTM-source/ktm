import { Link } from "react-router-dom";
import { Category } from "@/types/game";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className={cn(
        "glass-card group p-6 text-center hover:border-primary/50 transition-all duration-300 hover-glow opacity-0 animate-scale-in",
        `stagger-${(index % 6) + 1}`
      )}
    >
      <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:animate-float">
        {category.icon}
      </div>
      <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{category.count} لعبة</p>
    </Link>
  );
};
