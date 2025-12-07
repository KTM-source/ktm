-- Create coding projects table
CREATE TABLE public.coding_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'مشروع جديد',
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coding_projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view their own projects"
ON public.coding_projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create their own projects"
ON public.coding_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON public.coding_projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.coding_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_coding_projects_updated_at
BEFORE UPDATE ON public.coding_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();