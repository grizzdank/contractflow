import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Note: We use Clerk for authentication, Supabase is only used for database and storage
let supabase: ReturnType<typeof createClient<Database>>;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file or Vercel environment variables.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your environment variables.`);
  }

  // Log the Supabase URL (without the key for security)
  console.log('Initializing Supabase client with URL:', supabaseUrl);

  // Initialize Supabase client without auth features
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client that won't throw errors but will log them
  supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase }; 