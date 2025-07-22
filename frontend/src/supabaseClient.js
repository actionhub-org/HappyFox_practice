// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crnntqgtrpqkaxhimazw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybm50cWd0cnBxa2F4aGltYXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjU0NzQsImV4cCI6MjA2ODc0MTQ3NH0.ID3bMXXa8etsP7qyBs5aHgWVUeZSre4uCM_lG_tds9M';

export const supabase = createClient(supabaseUrl, supabaseKey);
