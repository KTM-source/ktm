import { Layout } from "@/components/layout/Layout";
import { CategoryCard } from "@/components/games/CategoryCard";
import { categories } from "@/data/games";

const Categories = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            تصنيفات الألعاب
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اختر تصنيفك المفضل واكتشف مئات الألعاب في كل فئة
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Info Section */}
        <div className="glass-card p-8 mt-12 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            تبحث عن لعبة معينة؟
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            استخدم خاصية البحث في صفحة الألعاب للعثور على أي لعبة بسرعة، أو تصفح التصنيفات للاكتشاف.
          </p>
          <a
            href="/games"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span className="relative z-10">تصفح كل الألعاب</span>
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
