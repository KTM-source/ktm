-- Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_permanently_verified boolean DEFAULT false;

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_text text NOT NULL,
  challenge_description text,
  challenge_type text NOT NULL DEFAULT 'daily',
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  challenge_hash text NOT NULL -- To prevent duplicate challenges
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_expires_at ON public.user_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_challenges_hash ON public.user_challenges(challenge_hash);

-- Enable RLS
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_challenges
CREATE POLICY "Users can view their own challenges" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (true);

-- Create challenge_history table to track completed challenges for verification
CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON public.challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_completed_at ON public.challenge_completions(completed_at);

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions" 
ON public.challenge_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" 
ON public.challenge_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant permanent verification to user with username 'ktm'
UPDATE public.profiles 
SET is_verified = true, is_permanently_verified = true 
WHERE username = 'ktm';