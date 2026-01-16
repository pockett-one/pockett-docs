-- Grant usage on schema public to anon/authenticated (if missing)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on contact_submissions table
GRANT ALL ON TABLE "public"."contact_submissions" TO anon, authenticated, service_role;

-- Grant permissions on the sequence (if used for id, though uuid is used here)
-- Just in case standard auto-increments are used elsewhere
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
