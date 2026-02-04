-- PM Skills Assessment Database Schema
-- Run this in Neon SQL Editor (https://console.neon.tech)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  organization VARCHAR(255),
  job_title VARCHAR(255),
  experience_level VARCHAR(50),
  is_admin BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  google_id VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if upgrading from previous schema
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
    ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
    ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
    ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expires') THEN
    ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
  END IF;
  -- Make password_hash nullable for Google OAuth users
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
END $$;

-- Assessment results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profile info at time of assessment
  profile_name VARCHAR(255),
  profile_title VARCHAR(255),
  profile_organization VARCHAR(255),
  profile_experience VARCHAR(50),
  certifications TEXT[], -- Array of certifications
  
  -- Objectives
  goal VARCHAR(50), -- exploring, support, job, pmp, improve
  timeline VARCHAR(10), -- 8, 12, 16 weeks
  learning_style VARCHAR(50), -- video, hands-on, balanced
  
  -- Scores (1-5 for each skill)
  score_basics INTEGER,
  score_agile INTEGER,
  score_product INTEGER,
  score_initiation INTEGER,
  score_scope INTEGER,
  score_time INTEGER,
  score_cost INTEGER,
  score_quality INTEGER,
  score_resources INTEGER,
  score_communication INTEGER,
  score_risk INTEGER,
  score_procurement INTEGER,
  score_softskills INTEGER,
  
  -- Calculated results
  overall_score INTEGER, -- 0-100
  gap_count INTEGER,
  strength_count INTEGER,
  
  -- Tracking
  pdf_downloaded BOOLEAN DEFAULT false,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner tracking table (for lead generation)
CREATE TABLE IF NOT EXISTS partner_leads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  assessment_id INTEGER REFERENCES assessment_results(id) ON DELETE CASCADE,
  partner_code VARCHAR(50), -- mcgill, thinkific, bizsimhub, etc.
  resource_clicked VARCHAR(255), -- Which resource/course was clicked
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_assessment_user ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_completed ON assessment_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_partner_leads_partner ON partner_leads(partner_code);
CREATE INDEX IF NOT EXISTS idx_partner_leads_user ON partner_leads(user_id);

-- Create initial admin user (change password after first login!)
-- Password: 'admin123' - CHANGE THIS!
-- INSERT INTO users (email, name, password_hash, is_admin, email_verified) 
-- VALUES ('admin@pmskillsassess.com', 'Admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.7D7PqL9V1NLJ3m', true, true);

-- Verify tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
