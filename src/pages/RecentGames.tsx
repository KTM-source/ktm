import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { useGames } from "@/hooks/useGames";
import { Clock, Calendar, Loader2 } from "lucide-react";

const RecentGames = () => {
  const { games, isLoading } = useGames();
  
  // Games are already sorted by created_at desc from the hook
  const today = new Date();
  
  const thisWeek = games.filter((game) => {
    const gameDate = new Date(game.created_at);
    const diffDays = Math.floor((today.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  const thisMonth = games.filter((game) => {
    const gameDate = new Date(game.created_at);
    const diffDays = Math.floor((today.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 7 && diffDays <= 30;
  });

  const older = games.filter((game) => {
    const gameDate = new Date(game.created_at);
    const diffDays = Math.floor((today.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              آخر التحديثات
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            تابع أحدث الألعاب والتحديثات المضافة للمكتبة
          </p>
        </div>

        {/* Empty State */}
        {games.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="font-display text-xl font-bold mb-2">لا توجد ألعاب حالياً</h2>
            <p className="text-muted-foreground">سيتم إضافة الألعاب قريباً</p>
          </div>
        )}

        {/* This Week */}
        {thisWeek.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-green-500" />
              <h2 className="font-display text-xl font-bold text-foreground">
                هذا الأسبوع
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                جديد
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {thisWeek.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* This Month */}
        {thisMonth.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-bold text-foreground">
                هذا الشهر
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {thisMonth.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Older */}
        {older.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display text-xl font-bold text-foreground">
                إضافات سابقة
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {older.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default RecentGames;
