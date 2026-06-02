import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Never throw at module level — a missing env var must not crash the app before React mounts.
// The UI will still render; Supabase calls will simply fail gracefully.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Check Vercel Environment Variables. Supabase features will be unavailable.'
  );
}

// Para o client público, usamos a anon key
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// E para o client admin (importação RSS, etc), podemos usar a service role
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder'
);

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  status: 'draft' | 'published';
  image_url: string | null;
  image_alt: string | null;
  tags: string[] | null;
  category: string | null;
  source_url: string | null;
  created_at: string;
  published_at: string | null;
};

export type RssSource = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  last_fetched: string | null;
  created_at: string;
};
