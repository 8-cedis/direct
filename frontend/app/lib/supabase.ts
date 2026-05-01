import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||"wzttxlhuecvyeldhmcqc"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dHR4bGh1ZWN2eWVsZGhtY3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDYwMDcsImV4cCI6MjA5Mjc4MjAwN30.CWA3s5gbwhWL8NMyLLqu_JZSlKeF1SdCLI_jIaQLIr4";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl as string, supabaseAnonKey as string) : null;