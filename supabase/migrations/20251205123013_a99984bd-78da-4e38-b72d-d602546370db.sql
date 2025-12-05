
-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    avatar_url TEXT,
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT username_format CHECK (
        username ~ '^[a-zA-Z0-9_-]{3,28}$'
    ),
    CONSTRAINT username_no_dots CHECK (
        username NOT LIKE '%.%'
    )
);

-- Create game comments table
CREATE TABLE public.game_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
ON public.game_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON public.game_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.game_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.game_comments FOR DELETE
USING (auth.uid() = user_id);

-- Function to check username availability
CREATE OR REPLACE FUNCTION public.is_username_available(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = check_username
    );
END;
$$;

-- Update user_favorites to use auth user_id
ALTER TABLE public.user_favorites DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_favorites ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_achievements to use auth user_id
ALTER TABLE public.user_achievements DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_achievements ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_stats to use auth user_id
ALTER TABLE public.user_stats DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_stats ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update game_ratings to use auth user_id
ALTER TABLE public.game_ratings DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.game_ratings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for user_favorites
DROP POLICY IF EXISTS "Allow all operations on favorites" ON public.user_favorites;
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Update RLS policies for user_achievements
DROP POLICY IF EXISTS "Allow all operations on achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for user_stats
DROP POLICY IF EXISTS "Allow all operations on stats" ON public.user_stats;
CREATE POLICY "Users can view their own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own stats"
ON public.user_stats FOR ALL
USING (auth.uid() = user_id);

-- Update RLS policies for game_ratings
DROP POLICY IF EXISTS "Allow all operations on ratings" ON public.game_ratings;
CREATE POLICY "Ratings are viewable by everyone"
ON public.game_ratings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can rate"
ON public.game_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.game_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.game_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
