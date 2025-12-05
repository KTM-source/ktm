import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useAchievements, ACHIEVEMENTS } from '@/hooks/useAchievements';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { GameCard } from '@/components/games/GameCard';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Eye, Download, Heart, MessageCircle, 
  Calendar, Flame, Award, Lock, Star, Settings,
  User, LogOut, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  version: string;
  category: string;
  size: string;
  rating: number | null;
  views: number;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFavoriteGames = async () => {
      if (favorites.length === 0) return;
      
      const gameIds = favorites.map(f => f.game_id);
      const { data } = await supabase
        .from('games')
        .select('id, title, slug, image, version, category, size, rating, views, created_at')
        .in('id', gameIds);

      if (data) setFavoriteGames(data);
    };

    fetchFavoriteGames();
  }, [favorites]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const allAchievements = Object.entries(ACHIEVEMENTS).map(([key, value]) => ({
    type: key,
    ...value,
    unlocked: achievements.some(a => a.achievement_type === key),
    unlockedAt: achievements.find(a => a.achievement_type === key)?.unlocked_at
  }));

  const unlockedCount = achievements.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  if (authLoading) {
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
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">
                {profile?.first_name} {profile?.last_name || ''}
              </h1>
              <p className="text-muted-foreground mb-4">@{profile?.username}</p>
              
              <div className="flex items-center justify-center gap-3">
                <Link to="/account">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    إعدادات الحساب
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-red-500 hover:text-red-600">
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {[
              { icon: Eye, label: 'ألعاب شاهدتها', value: stats?.games_viewed || 0, color: 'from-blue-500 to-cyan-500' },
              { icon: Download, label: 'ألعاب حملتها', value: stats?.games_downloaded || 0, color: 'from-green-500 to-emerald-500' },
              { icon: Heart, label: 'في المفضلة', value: favorites.length, color: 'from-red-500 to-pink-500' },
              { icon: MessageCircle, label: 'رسائل للبوت', value: stats?.chat_messages_sent || 0, color: 'from-purple-500 to-violet-500' },
              { icon: Flame, label: 'أيام متتالية', value: stats?.streak_days || 1, color: 'from-orange-500 to-amber-500' },
              { icon: Trophy, label: 'إنجازات', value: `${unlockedCount}/${totalCount}`, color: 'from-yellow-500 to-amber-500' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="relative group overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-4 hover:border-primary/30 transition-all duration-300"
              >
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300',
                  stat.color
                )} />
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3',
                  stat.color
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Achievements Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                الإنجازات
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{unlockedCount}/{totalCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allAchievements.map((achievement) => (
                <div
                  key={achievement.type}
                  className={cn(
                    'relative rounded-2xl p-4 text-center transition-all duration-300',
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30'
                      : 'bg-card/30 border border-border/30 opacity-50 grayscale'
                  )}
                >
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={cn(
                    'text-4xl mb-2 transition-transform duration-300',
                    achievement.unlocked && 'hover:scale-125'
                  )}>
                    {achievement.icon}
                  </div>
                  <div className="font-semibold text-sm mb-1">{achievement.name}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-2 text-xs text-yellow-500">
                      {format(new Date(achievement.unlockedAt), 'd MMM yyyy', { locale: ar })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Games */}
          {favoriteGames.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-red-500" />
                ألعابي المفضلة
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {favoriteGames.map((game, index) => (
                  <GameCard key={game.id} game={game} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Account Info */}
          {stats && (
            <div className="mt-12 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                معلومات الحساب
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">أول زيارة: </span>
                  <span className="font-medium">
                    {format(new Date(stats.first_visit), 'd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">آخر زيارة: </span>
                  <span className="font-medium">
                    {format(new Date(stats.last_visit), 'd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">أطول سلسلة أيام: </span>
                  <span className="font-medium">{stats.longest_streak} أيام</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
