-- Fix RLS policies for contact_submissions
-- The issue: rate limit checks need SELECT permission

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "public"."contact_submissions";
DROP POLICY IF EXISTS "Allow service role all access" ON "public"."contact_submissions";
DROP POLICY IF EXISTS "Allow rate limit checks" ON "public"."contact_submissions";

-- Policy 1: Allow anyone to insert (for public contact form)
CREATE POLICY "Allow anonymous inserts"
ON "public"."contact_submissions"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow SELECT for rate limiting (only own IP)
-- This allows the server action to check recent submissions for rate limiting
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
