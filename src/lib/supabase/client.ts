import { createClient, SupabaseClient } from '@supabase/supabase-js';

const initializeSupabase = (): SupabaseClient | { error: string } => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('SUA_URL_SUPABASE_AQUI') || !supabaseAnonKey || supabaseAnonKey.includes('SUA_CHAVE_ANON_AQUI')) {
    const message = 'As credenciais do Supabase não estão configuradas no arquivo .env.local. Por favor, adicione a URL e a chave anon do seu projeto.';
    if (process.env.NODE_ENV === 'development') {
      console.warn(message);
    }
    return { error: message };
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const fullMessage = `Falha ao criar o cliente Supabase: "${errorMessage}". Verifique se a URL em .env.local está bem formatada (ex: https://<id>.supabase.co).`;
    if (process.env.NODE_ENV === 'development') {
      console.error(fullMessage);
    }
    return { error: fullMessage };
  }
}

export const supabase = initializeSupabase();
