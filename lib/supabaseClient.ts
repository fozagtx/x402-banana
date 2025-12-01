import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wuutuuzsthwpkptnoqsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dXR1dXpzdGh3cGtwdG5vcXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODU3ODYsImV4cCI6MjA3ODk2MTc4Nn0.0p3zZWtadYghBHlVbZmMGNTPnpbq-r97d88pWuqn1RI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
