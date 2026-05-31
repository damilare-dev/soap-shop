import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = cloudEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function loadRemoteData(): Promise<string | null> {
 if (!supabase) return null;
 const { data, error } = await supabase
 .from('soapstock')
 .select('data')
 .eq('id', 'default')
 .single();
 if (error) {
 console.warn('Supabase load failed:', error.message);
 return null;
 }
 return data?.data ?? null;
}

export async function saveRemoteData(data: string): Promise<void> {
 if (!supabase) return;
 const { error } = await supabase
 .from('soapstock')
 .upsert({ id: 'default', data });
 if (error) {
 console.warn('Supabase save failed:', error.message);
 }
}
