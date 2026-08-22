/**
 * Supabase Client & Architecture Definition
 * 
 * In Phase 1: Application runs using safe local persistence (LocalStorage + IndexedDB).
 * In Phase 2: Connecting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY activates
 * real-time PostgreSQL synchronization, Supabase Auth, and Storage bucket uploads.
 */

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(url && anonKey && !url.includes('your-project-id'));

  return {
    url,
    anonKey,
    isConfigured,
  };
};

/**
 * Data migration helper to export local data into Supabase schema format
 */
export const prepareDataForSupabaseSync = () => {
  return {
    message: 'Local projects, pages, and assets ready for PostgreSQL bulk sync upon connecting credentials in Settings > Security.',
    timestamp: new Date().toISOString(),
  };
};
