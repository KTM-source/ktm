-- Add share_id column to coding_projects for sharing functionality
ALTER TABLE public.coding_projects 
ADD COLUMN IF NOT EXISTS share_id text UNIQUE,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create index for faster share lookups
CREATE INDEX IF NOT EXISTS idx_coding_projects_share_id ON public.coding_projects(share_id);

-- Create policy to allow reading public projects
CREATE POLICY "Anyone can view public projects" 
ON public.coding_projects 
FOR SELECT 
USING (is_public = true);