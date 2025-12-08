-- Add trailer_url column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS trailer_url text;

-- Add comment
COMMENT ON COLUMN public.games.trailer_url IS 'URL for game trailer video (direct MP4 link or YouTube embed URL)';