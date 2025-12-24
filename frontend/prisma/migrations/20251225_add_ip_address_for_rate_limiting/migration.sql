-- Add ip_address column for rate limiting
ALTER TABLE "public"."contact_submissions" 
ADD COLUMN "ip_address" TEXT;

-- Create index for efficient rate limit queries
CREATE INDEX "contact_submissions_ip_address_created_at_idx" 
ON "public"."contact_submissions"("ip_address", "created_at");
