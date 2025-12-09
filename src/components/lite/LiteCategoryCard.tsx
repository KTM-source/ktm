import { Link } from "react-router-dom";

interface LiteCategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    count: number;
  };
}

export const LiteCategoryCard = ({ category }: LiteCategoryCardProps) => {
  return (
    <Link to={`/categories/${category.slug}`} className="lite-category-card">
      <div className="lite-category-icon">{category.icon}</div>
      <div className="lite-category-name">{category.name}</div>
      <div className="lite-category-count">{category.count} لعبة</div>
    </Link>
  );
};
