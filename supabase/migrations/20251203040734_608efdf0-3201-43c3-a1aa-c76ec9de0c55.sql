-- Create storage bucket for game images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('game-images', 'game-images', true);

-- Allow public read access
CREATE POLICY "Game images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

-- Allow authenticated/admin uploads (using service role from edge function)
CREATE POLICY "Allow public uploads to game-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-images');

-- Allow updates
CREATE POLICY "Allow public updates to game-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'game-images');

-- Allow deletes
CREATE POLICY "Allow public deletes from game-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-images');