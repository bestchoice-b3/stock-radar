import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll throw an error during development if keys are missing.
  if (process.env.NODE_ENV === 'development') {
    console.warn('Supabase URL and/or anonymous key are not defined in .env.local. The app will not be able to connect to Supabase.');
  }
}

// The client is created with possibly empty strings, but Supabase client handles this.
// API calls will fail if credentials are not provided, which is handled in the UI.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
