import { useChallenges } from '@/hooks/useChallenges';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { 
  Trophy, Target, CheckCircle2, Clock, Sparkles, 
  RefreshCw, Loader2, MessageSquare, Star, Heart, Eye, Image, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

const challengeTypeIcons: Record<string, typeof Target> = {
  comment: MessageSquare,
  rate_games: Star,
  add_favorites: Heart,
  view_games: Eye,
  avatar_change: Image,
  send_message: Mail,
  gaming: Target,
  social: MessageSquare,
  exploration: Eye,
  creative: Star
};

const challengeTypeColors: Record<string, string> = {
  comment: 'from-blue-500 to-cyan-500',
  rate_games: 'from-yellow-500 to-orange-500',
  add_favorites: 'from-pink-500 to-red-500',
  view_games: 'from-green-500 to-emerald-500',
  avatar_change: 'from-purple-500 to-pink-500',
  send_message: 'from-indigo-500 to-blue-500',
  gaming: 'from-purple-500 to-pink-500',
  social: 'from-blue-500 to-cyan-500',
  exploration: 'from-green-500 to-emerald-500',
  creative: 'from-orange-500 to-yellow-500'
};

const challengeTypeLabels: Record<string, string> = {
  comment: 'تعليق',
  rate_games: 'تقييم',
  add_favorites: 'مفضلة',
  view_games: 'استكشاف',
  avatar_change: 'أفتار',
  send_message: 'رسالة'
};

export const DailyChallenges = () => {
  const { 
    challenges, 
    isLoading, 
    verificationStatus, 
    generateNewChallenges 
  } = useChallenges();

  const completedCount = challenges.filter(c => c.is_completed).length;
  const progress = challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0;

  // Calculate time until reset (3 AM UTC)
  const getTimeUntilReset = () => {
    const now = new Date();
    const reset = new Date();
    reset.setUTCHours(3, 0, 0, 0);
    if (reset <= now) {
      reset.setDate(reset.getDate() + 1);
    }
    const diff = reset.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Parse challenge verification data
  const parseVerificationData = (description: string | null) => {
    try {
      if (description) {
        const parsed = JSON.parse(description);
        return parsed.verification_data || {};
      }
    } catch (e) {
      // ignore
    }
    return {};
  };

  if (isLoading) {
    return (
      <div className="glass-morphism rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20" />
          <div className="h-6 w-40 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-morphism rounded-2xl p-6 border border-primary/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              التحديات اليومية
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </h2>
            <p className="text-sm text-muted-foreground">تُحقق تلقائياً عند إنجازها</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>تتجدد خلال {getTimeUntilReset()}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{completedCount}/{challenges.length} تحديات مكتملة</span>
          <span className="text-sm text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <div className={cn(
          "mb-6 p-4 rounded-xl border transition-all",
          verificationStatus.verified 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-card/50 border-border/50"
        )}>
          <div className="flex items-center gap-3">
            {verificationStatus.verified ? (
              <>
                <VerifiedBadge size="lg" />
                <div>
                  <p className="font-semibold text-green-400">
                    {verificationStatus.permanent ? 'توثيق دائم ✨' : 'حسابك موثق! ✓'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verificationStatus.permanent 
                      ? 'أنت تمتلك توثيقاً دائماً' 
                      : `أكملت ${verificationStatus.completions} تحدي خلال آخر 30 يوم`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="font-semibold">احصل على التوثيق!</p>
                  <p className="text-sm text-muted-foreground">
                    أكمل {30 - verificationStatus.completions} تحدي إضافي للحصول على شارة التوثيق
                  </p>
                  <Progress 
                    value={(verificationStatus.completions / 30) * 100} 
                    className="h-1.5 mt-2" 
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.length > 0 ? (
          challenges.map((challenge, index) => {
            const Icon = challengeTypeIcons[challenge.challenge_type] || Target;
            const gradient = challengeTypeColors[challenge.challenge_type] || 'from-primary to-accent';
            const typeLabel = challengeTypeLabels[challenge.challenge_type] || 'تحدي';
            const verificationData = parseVerificationData(challenge.challenge_description);
            
            return (
              <div
                key={challenge.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300",
                  challenge.is_completed 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-card/50 border-border/50 hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl bg-gradient-to-br",
                    gradient,
                    challenge.is_completed && "opacity-50"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {typeLabel}
                      </span>
                      {challenge.is_completed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                          مكتمل ✓
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "font-medium",
                      challenge.is_completed && "line-through text-muted-foreground"
                    )}>
                      {challenge.challenge_text}
                    </p>
                    
                    {/* Verification hints */}
                    {!challenge.is_completed && (
                      <p className="text-xs text-muted-foreground mt-1 opacity-75">
                        {challenge.challenge_type === 'comment' && verificationData.required_text && (
                          <>💬 يجب أن يحتوي التعليق على: <span className="text-primary">"{verificationData.required_text}"</span></>
                        )}
                        {challenge.challenge_type === 'avatar_change' && verificationData.avatar_description && (
                          <>📷 الصورة المطلوبة: <span className="text-primary">{verificationData.avatar_description}</span></>
                        )}
                        {challenge.challenge_type === 'rate_games' && verificationData.required_count && (
                          <>⭐ المطلوب: تقييم {verificationData.required_count} ألعاب</>
                        )}
                        {challenge.challenge_type === 'add_favorites' && verificationData.required_count && (
                          <>❤️ المطلوب: إضافة {verificationData.required_count} ألعاب للمفضلة</>
                        )}
                        {challenge.challenge_type === 'view_games' && verificationData.required_count && (
                          <>👁️ المطلوب: مشاهدة {verificationData.required_count} ألعاب</>
                        )}
                        {challenge.challenge_type === 'send_message' && (
                          <>✉️ أرسل رسالة عبر صفحة التواصل</>
                        )}
                      </p>
                    )}
                  </div>

                  {challenge.is_completed && (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">لا توجد تحديات حالياً</p>
            <Button onClick={generateNewChallenges} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              توليد تحديات جديدة
            </Button>
          </div>
        )}
      </div>
      
      {/* Auto-verification note */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        💡 التحديات تتحقق تلقائياً عند تنفيذ المطلوب
      </p>
    </div>
  );
};
