-- Add column to track last username change
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_username_change timestamp with time zone DEFAULT NULL;