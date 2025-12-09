import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useFavorites } from "@/hooks/useFavorites";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const LiteFavorites = () => {
  const { user } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { games, isLoading: gamesLoading } = useGames();

  const isLoading = favoritesLoading || gamesLoading;

  const favoriteGames = games.filter((game) =>
    favorites.some((fav) => fav.game_id === game.id)
  );

  if (!user) {
    return (
      <LiteLayout>
        <section className="lite-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
          <div className="lite-empty">
            <div className="lite-empty-icon">🔐</div>
            <p className="lite-empty-text">يجب تسجيل الدخول لعرض المفضلة</p>
            <Link to="/auth" className="lite-button" style={{ marginTop: "1rem", display: "inline-block" }}>
              تسجيل الدخول
            </Link>
          </div>
        </section>
      </LiteLayout>
    );
  }

  if (isLoading) {
    return (
      <LiteLayout>
        <div className="lite-loading">جاري التحميل...</div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <LiteSectionHeader
          title="المفضلة"
          subtitle={`${favoriteGames.length} لعبة في قائمتك`}
        />
        <div className="lite-game-grid">
          {favoriteGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {favoriteGames.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">💜</div>
            <p className="lite-empty-text">لا توجد ألعاب في المفضلة</p>
            <Link to="/games" className="lite-button" style={{ marginTop: "1rem", display: "inline-block" }}>
              تصفح الألعاب
            </Link>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteFavorites;
