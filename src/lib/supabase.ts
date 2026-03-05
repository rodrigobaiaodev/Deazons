import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase variables are missing from .env');
}

// Para o client público, usamos a anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// E para o client admin (importação RSS, etc), podemos usar a service role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

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
