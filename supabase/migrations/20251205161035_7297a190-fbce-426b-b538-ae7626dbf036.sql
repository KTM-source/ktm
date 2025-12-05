-- Add unique constraint for user_id and game_id combination in game_ratings
ALTER TABLE public.game_ratings 
ADD CONSTRAINT game_ratings_user_game_unique UNIQUE (user_id, game_id);