-- Enable Row Level Security on contact_submissions table
ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "public"."contact_submissions";
DROP POLICY IF EXISTS "Allow service role all access" ON "public"."contact_submissions";

-- Policy 1: Allow anyone to insert (for public contact form)
CREATE POLICY "Allow anonymous inserts"
ON "public"."contact_submissions"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow service role full access (for admin operations)
CREATE POLICY "Allow service role all access"
ON "public"."contact_submissions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
