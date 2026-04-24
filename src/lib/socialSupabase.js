import { createClient } from '@supabase/supabase-js'

export const socialSupabase = createClient(
  process.env.NEXT_PUBLIC_SOCIAL_DASH_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SOCIAL_DASH_SUPABASE_ANON_KEY
)
