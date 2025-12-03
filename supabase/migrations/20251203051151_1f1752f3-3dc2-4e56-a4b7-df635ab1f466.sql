-- Add DELETE policies for reports, contact_messages, and game_requests

CREATE POLICY "Anyone can delete reports" 
ON public.reports 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can delete contact messages" 
ON public.contact_messages 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can delete game requests" 
ON public.game_requests 
FOR DELETE 
USING (true);