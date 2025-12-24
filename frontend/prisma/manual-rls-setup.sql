-- Manual RLS policy application for local development
-- Run this in Supabase Studio SQL Editor if migrations don't apply RLS correctly

-- First, ensure RLS is enabled
ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "public"."contact_submissions";
DROP POLICY IF EXISTS "Allow service role all access" ON "public"."contact_submissions";
DROP POLICY IF EXISTS "Allow rate limit checks" ON "public"."contact_submissions";

-- Policy 1: Allow anyone to insert (for public contact form)
CREATE POLICY "Allow anonymous inserts"
ON "public"."contact_submissions"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow SELECT for rate limiting
CREATE POLICY "Allow rate limit checks"
ON "public"."contact_submissions"
FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- Policy 3: Allow service role full access (for admin operations)
CREATE POLICY "Allow service role all access"
ON "public"."contact_submissions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'contact_submissions';
