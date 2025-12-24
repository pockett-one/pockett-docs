-- Enable RLS on contact_submissions table
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon, authenticated, service_role) to insert contact submissions
-- This is safe because it's a public contact form
CREATE POLICY "Allow public insert on contact_submissions"
ON contact_submissions
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

-- Allow service_role to read all contact submissions (for admin access)
CREATE POLICY "Allow service_role to read contact_submissions"
ON contact_submissions
FOR SELECT
TO service_role
USING (true);
