/*
  # Initial Schema for Emergency Healthcare System

  1. New Tables
    - users (extends Supabase auth)
      - Custom user fields including role and contact information
    - emergency_cases
      - Tracks emergency incidents
      - Includes location, severity, and assignment details
    - hospitals
      - Hospital information and resource tracking
    - emergency_responders
      - Responder profiles and current status
    - medical_records
      - Patient medical history and records
    
  2. Security
    - RLS enabled on all tables
    - Role-based access policies
    - Secure medical record access
*/

-- Users table extending Supabase auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('patient', 'responder', 'hospital', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency cases table
CREATE TABLE IF NOT EXISTS emergency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
  location JSONB NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_hospital_id UUID,
  assigned_responder_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location JSONB NOT NULL,
  capacity JSONB NOT NULL,
  resources JSONB NOT NULL,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency responders table
CREATE TABLE IF NOT EXISTS emergency_responders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vehicle_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('available', 'assigned', 'busy')),
  location JSONB,
  last_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id),
  record_type TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

-- Emergency cases policies
CREATE POLICY "Anyone can create emergency cases"
  ON emergency_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authorized users can view relevant cases"
  ON emergency_cases
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id
    OR auth.uid() IN (
      SELECT user_id FROM emergency_responders WHERE id = assigned_responder_id
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hospital')
    )
  );

-- Hospitals policies
CREATE POLICY "Public hospital info readable"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

-- Emergency responders policies
CREATE POLICY "Responders can manage their own data"
  ON emergency_responders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Medical records policies
CREATE POLICY "Strict medical records access"
  ON medical_records
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hospital')
    )
  );