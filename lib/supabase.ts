import { createClient } from "@supabase/supabase-js"

// Use the correct Supabase environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // This should be the anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
}
