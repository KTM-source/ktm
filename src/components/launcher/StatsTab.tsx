import { useState, useEffect } from 'react';
import { 
  BarChart3, Clock, Gamepad2, Trophy, TrendingUp, 
  Calendar, Play, Timer, Star, Activity
} from 'lucide-react';
import { useRunningGames, GamePlaytime } from '@/hooks/useRunningGames';
import { useElectron } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatsTab = () => {
  const { playtimeStats, getTotalPlaytime, formatPlaytime, runningGames } = useRunningGames();
  const { installedGames } = useElectron();
  
  const totalPlaytime = getTotalPlaytime();
  const totalSize = installedGames.reduce((acc, g) => acc + g.size, 0);
  const mostPlayedGame = [...playtimeStats].sort((a, b) => b.totalPlaytime - a.totalPlaytime)[0];
  const recentlyPlayed = [...playtimeStats].sort((a, b) => 
    new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
  ).slice(0, 5);

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-primary/30">
            <BarChart3 className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">الإحصائيات</h2>
          <p className="text-sm text-muted-foreground">تتبع وقت اللعب والإنجازات</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="إجمالي وقت اللعب"
          value={formatPlaytime(totalPlaytime)}
          color="from-blue-500/20 to-cyan-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={<Gamepad2 className="w-6 h-6" />}
          label="الألعاب المثبتة"
          value={`${installedGames.length} لعبة`}
          color="from-purple-500/20 to-pink-500/20"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="قيد التشغيل الآن"
          value={`${runningGames.length} لعبة`}
          color="from-green-500/20 to-emerald-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={<Timer className="w-6 h-6" />}
          label="حجم المكتبة"
          value={formatSize(totalSize)}
          color="from-orange-500/20 to-amber-500/20"
          iconColor="text-orange-400"
        />
      </div>

      {/* Most Played Game */}
      {mostPlayedGame && (
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-foreground">اللعبة الأكثر لعباً</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl bg-muted/50 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-primary/50" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-foreground">{mostPlayedGame.gameTitle}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4 inline mr-1" />
                {formatPlaytime(mostPlayedGame.totalPlaytime)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {mostPlayedGame.sessions} جلسة لعب
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currently Running */}
      {runningGames.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-green-400 fill-current animate-pulse" />
            <h3 className="font-bold text-foreground">قيد التشغيل الآن</h3>
          </div>
          <div className="space-y-3">
            {runningGames.map((game) => (
              <div key={game.gameId} className="flex items-center justify-between bg-green-500/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium text-foreground">{game.gameTitle}</span>
                </div>
                <span className="text-sm text-green-400">
                  {formatPlaytime(Math.floor((Date.now() - game.startTime) / 1000))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playtime by Game */}
      <div className="bg-muted/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">وقت اللعب لكل لعبة</h3>
        </div>
        
        {playtimeStats.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد بيانات وقت لعب بعد</p>
            <p className="text-sm opacity-70">ابدأ بتشغيل الألعاب لرؤية الإحصائيات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...playtimeStats]
              .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
              .map((game, index) => {
                const maxPlaytime = playtimeStats.reduce((max, g) => Math.max(max, g.totalPlaytime), 0);
                const percentage = maxPlaytime > 0 ? (game.totalPlaytime / maxPlaytime) * 100 : 0;
                
                return (
                  <div key={game.gameId} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">{game.gameTitle}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{formatPlaytime(game.totalPlaytime)}</p>
                        <p className="text-xs text-muted-foreground">{game.sessions} جلسة</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div className="bg-muted/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">تم اللعب مؤخراً</h3>
          </div>
          <div className="space-y-2">
            {recentlyPlayed.map((game) => (
              <div key={game.gameId} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="font-medium text-foreground">{game.gameTitle}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(game.lastPlayed).toLocaleDateString('ar-SA')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ 
  icon, 
  label, 
  value, 
  color, 
  iconColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
  iconColor: string;
}) => (
  <div className={cn("bg-gradient-to-br rounded-2xl p-5 border border-border/30", color)}>
    <div className={cn("mb-3", iconColor)}>{icon}</div>
    <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default StatsTab;
