-- =====================================================
-- SisaPangan Solo — Database Schema
-- Apply via: Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES
-- Extends Supabase auth.users with app metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('donor', 'volunteer', 'non-consumption', 'monitor', 'admin')),
  type TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  contact_number TEXT,
  estimated_capacity TEXT,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  -- is_verified: volunteer & non-consumption require admin approval before accessing surplus
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add is_verified if it doesn't exist yet (safe to run on existing databases)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: users can read any" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles: users can update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: insert on signup" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: admin full control" ON profiles USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_is_verified BOOLEAN;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'donor');
  -- Volunteer and non-consumption require admin verification; all other roles are auto-verified
  v_is_verified := CASE
    WHEN v_role IN ('volunteer', 'non-consumption') THEN FALSE
    ELSE TRUE
  END;

  INSERT INTO profiles (id, name, role, type, location, contact_number, estimated_capacity, whatsapp_opt_in, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    v_role,
    NEW.raw_user_meta_data->>'type',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'contact_number',
    NEW.raw_user_meta_data->>'estimated_capacity',
    COALESCE((NEW.raw_user_meta_data->>'whatsapp_opt_in')::BOOLEAN, TRUE),
    v_is_verified
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent trigger failure from causing Supabase Auth 500 errors
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- SURPLUS BATCH
-- Core food posting entity
-- =====================================================
CREATE TABLE IF NOT EXISTS surplus_batch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('Makanan Matang', 'Roti/Bakery', 'Buah Potong', 'Sayuran', 'Bahan Segar', 'Pakan/Kompos', 'Lainnya')
  ),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'porsi' CHECK (unit IN ('porsi', 'kg', 'box')),
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_label TEXT,
  storage_condition TEXT CHECK (storage_condition IN ('suhu_ruang', 'kulkas')),
  estimated_expiry TIMESTAMPTZ NOT NULL,
  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Tersedia' CHECK (
    status IN ('Tersedia', 'Diklaim', 'Diambil', 'Selesai')
  ),
  freshness_status TEXT NOT NULL DEFAULT 'safe' CHECK (
    freshness_status IN ('safe', 'urgent', 'non-consumption')
  ),
  freshness_reason TEXT,
  qr_code TEXT UNIQUE,
  qr_data_url TEXT,
  pickup_rating SMALLINT CHECK (pickup_rating BETWEEN 1 AND 5),
  volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- set when batch is claimed
  template_id UUID, -- references surplus_template if from a recurring batch
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add volunteer_id if it doesn't exist yet (safe to run on existing databases)
ALTER TABLE surplus_batch ADD COLUMN IF NOT EXISTS volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS surplus_batch_donor_id_idx ON surplus_batch(donor_id);
CREATE INDEX IF NOT EXISTS surplus_batch_status_idx ON surplus_batch(status);
CREATE INDEX IF NOT EXISTS surplus_batch_freshness_status_idx ON surplus_batch(freshness_status);
CREATE INDEX IF NOT EXISTS surplus_batch_estimated_expiry_idx ON surplus_batch(estimated_expiry);
-- CREATE INDEX IF NOT EXISTS surplus_batch_location_idx ON surplus_batch USING gist (
--   ll_to_earth(location_lat, location_lng)
-- ) WHERE FALSE; -- placeholder; use PostGIS or earthdistance if needed

-- RLS
ALTER TABLE surplus_batch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surplus: anyone can read available" ON surplus_batch
  FOR SELECT USING (TRUE);
CREATE POLICY "surplus: donors can insert own" ON surplus_batch
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "surplus: donors can update own" ON surplus_batch
  FOR UPDATE USING (auth.uid() = donor_id);
CREATE POLICY "surplus: volunteers can update status" ON surplus_batch
  FOR UPDATE USING (
    auth.uid() != donor_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('volunteer', 'non-consumption')
  );
CREATE POLICY "surplus: donors can delete own" ON surplus_batch
  FOR DELETE USING (auth.uid() = donor_id);
CREATE POLICY "surplus: admin full control" ON surplus_batch USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- SURPLUS TEMPLATE (Recurring Surplus)
-- =====================================================
CREATE TABLE IF NOT EXISTS surplus_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'porsi',
  storage_condition TEXT,
  estimated_hours NUMERIC NOT NULL DEFAULT 6,
  notes TEXT,
  schedule_days INTEGER[] NOT NULL DEFAULT '{}', -- 0=Sun .. 6=Sat
  schedule_time TEXT NOT NULL DEFAULT '08:00', -- HH:MM
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE surplus_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template: donors manage own" ON surplus_template
  USING (auth.uid() = donor_id);
CREATE POLICY "template: admin full control" ON surplus_template USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- DISTRIBUTION LOG
-- Timeline of status changes per batch
-- =====================================================
CREATE TABLE IF NOT EXISTS distribution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES surplus_batch(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (
    status IN ('Tersedia', 'Diklaim', 'Diambil', 'Selesai')
  ),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS dist_log_batch_id_idx ON distribution_log(batch_id);
CREATE INDEX IF NOT EXISTS dist_log_volunteer_id_idx ON distribution_log(volunteer_id);

ALTER TABLE distribution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dist_log: anyone can read" ON distribution_log FOR SELECT USING (TRUE);
CREATE POLICY "dist_log: auth users can insert" ON distribution_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "dist_log: admin full control" ON distribution_log USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- NOTIFICATION LOG
-- Audit trail for WhatsApp notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES surplus_batch(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT,
  target_number TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_log: admins/donors can read" ON notification_log
  FOR SELECT USING (
    auth.uid() = sender_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'monitor'
  );
CREATE POLICY "notif_log: auth users can insert" ON notification_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notif_log: admin full control" ON notification_log USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- USER ACTIVITY LOG
-- Audit trail for user activities & platform monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  role TEXT NOT NULL,
  action TEXT NOT NULL,         -- 'login', 'claim_batch', 'complete_batch', 'add_surplus', 'update_profile', 'verify_user', etc.
  resource_type TEXT,           -- 'surplus_batch', 'profile', 'user', etc.
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_act_log_user_id_idx ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS user_act_log_role_idx ON user_activity_log(role);
CREATE INDEX IF NOT EXISTS user_act_log_created_at_idx ON user_activity_log(created_at);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log: auth users can insert" ON user_activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "activity_log: anyone can read" ON user_activity_log
  FOR SELECT USING (TRUE);
CREATE POLICY "activity_log: auth users can delete" ON user_activity_log
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- BENEFICIARIES (Drop-off locations)
-- =====================================================
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_label TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beneficiaries: anyone can read" ON beneficiaries FOR SELECT USING (TRUE);
CREATE POLICY "beneficiaries: admin full control" ON beneficiaries USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- =====================================================
-- STORAGE BUCKETS (Create and define policies)
-- =====================================================
-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('surplus-photos', 'surplus-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files in the bucket
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'surplus-photos');

-- 3. Allow authenticated users to upload files in the bucket
CREATE POLICY "Authenticated Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'surplus-photos' AND 
    auth.role() = 'authenticated'
  );

-- 4. Allow donors/admins to delete files they own in the bucket
CREATE POLICY "Owner Delete Access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'surplus-photos' AND 
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- =====================================================
-- SAMPLE DATA (Demo / Presentation)
-- =====================================================
-- Uncomment to insert demo data for presentations:
/*
INSERT INTO profiles (id, name, role, type, location, contact_number, whatsapp_opt_in)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Warung Bu Sari', 'donor', 'UMKM Kuliner', 'Jl. Slamet Riyadi, Solo', '081234567890', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Relawan PRMD', 'volunteer', 'Komunitas', 'Laweyan, Solo', '081234567891', TRUE);

INSERT INTO surplus_batch (id, donor_id, name, category, quantity, unit, location_lat, location_lng, location_label, estimated_expiry, status, freshness_status, freshness_reason, qr_code)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Nasi kotak sisa rapat', 'Makanan Matang', 20, 'porsi', -7.5706, 110.8249, 'Jl. Slamet Riyadi No.12, Solo', NOW() + INTERVAL '3 hours', 'Tersedia', 'safe', 'Kategori makanan matang, sisa waktu 3 jam, status: layak konsumsi', 'DEMO0001'),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Roti tawar sisa display', 'Roti/Bakery', 15, 'box', -7.5731, 110.8196, 'Pasar Gede Solo', NOW() + INTERVAL '8 hours', 'Tersedia', 'safe', 'Kategori roti/bakery, sisa waktu 8 jam, status: layak konsumsi', 'DEMO0002');
*/
