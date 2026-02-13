-- Create Admin Schema
CREATE SCHEMA IF NOT EXISTS admin;

-- ============================================================================
-- Admin Tables (Keep existing structure)
-- ============================================================================

-- Contact Submissions
CREATE TABLE IF NOT EXISTS admin.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    email TEXT,
    plan TEXT,
    role TEXT,
    team_size TEXT,
    pain_point TEXT,
    feature_request TEXT,
    comments TEXT
);

-- Waitlist
CREATE TABLE IF NOT EXISTS admin.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'Pro',
    company_name TEXT,
    company_size TEXT,
    role TEXT,
    comments TEXT,
    ip_address TEXT,
    referral_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
    referred_by TEXT,
    referral_count INTEGER NOT NULL DEFAULT 0,
    position_boost INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON admin.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_plan ON admin.waitlist(plan);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON admin.waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON admin.waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON admin.waitlist(referred_by);
