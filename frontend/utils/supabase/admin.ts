import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 * 
 * This client uses the SUPABASE_SERVICE_ROLE_KEY and should ONLY be used
 * on the server (Server Actions, API Routes). It bypasses RLS and can
 * update user metadata.
 */
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase Admin environment variables");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
