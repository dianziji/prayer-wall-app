import { createBrowserClient } from '@supabase/ssr'
import { createClient as createServerClient } from '@supabase/supabase-js'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
