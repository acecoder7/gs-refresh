import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://qqjrfcknotgmuprubesz.supabase.co',   // your API URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxanJmY2tub3RnbXVwcnViZXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzE5NjEsImV4cCI6MjA2NjQwNzk2MX0.pr8NoIA9EohxMXNdhIkE2eWE-WPSQ_leb8s6-_C5MqM'                       // your anon key
);
