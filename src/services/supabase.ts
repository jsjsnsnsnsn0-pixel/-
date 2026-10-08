import { createClient } from '@supabase/supabase-js';
import {fetchWithDeadline} from './request';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && /^https?:\/\//.test(url) && key);
// App displays setup instructions before mounting providers if configuration is absent.
export const supabase = createClient(
  isSupabaseConfigured ? url : 'http://127.0.0.1:54321',
  isSupabaseConfigured ? key : 'unconfigured',
  {auth: {flowType: 'pkce'}, global: {fetch: fetchWithDeadline}},
);
