-- Create published_websites table for storing published websites
CREATE TABLE public.published_websites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.coding_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    username TEXT NOT NULL UNIQUE,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.published_websites ENABLE ROW LEVEL SECURITY;

-- Policy for owners to manage their websites
CREATE POLICY "Users can manage their own websites"
ON public.published_websites
FOR ALL
USING (auth.uid() = user_id);

-- Policy for public viewing
CREATE POLICY "Published websites are viewable by everyone"
ON public.published_websites
FOR SELECT
USING (true);

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.is_website_username_available(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.published_websites WHERE username = check_username
    );
END;
$$;