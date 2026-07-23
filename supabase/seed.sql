-- =====================================================
-- SisaPangan Solo — Database Seed Data
-- Apply via: Supabase Dashboard > SQL Editor
-- OR via Supabase CLI: supabase db reset
-- =====================================================

-- Clean existing seed data in correct order to avoid foreign key violations
DELETE FROM notification_log;
DELETE FROM distribution_log;
DELETE FROM surplus_batch;
DELETE FROM surplus_template;
DELETE FROM beneficiaries;

DELETE FROM auth.users WHERE email IN (
  'admin@mail.com',
  'donor@mail.com',
  'volunteer@mail.com',
  'noncon@mail.com',
  'monitor@mail.com'
);

-- =====================================================
-- 1. INSERT USERS INTO auth.users
-- Fully populated auth.users rows to prevent GoTrue 500 errors.
-- Uses pgcrypto crypt() with gen_salt('bf', 10) for "123456".
-- =====================================================
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  is_sso_user,
  is_anonymous,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  reauthentication_token
)
VALUES
  -- Admin
  (
    'a0000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@mail.com',
    crypt('123456', gen_salt('bf', 10)),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin SisaPangan", "role": "admin", "type": "Sistem Admin", "location": "Solo Raya", "contact_number": "081111111111", "whatsapp_opt_in": true}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    FALSE,
    FALSE,
    '',
    '',
    '',
    0,
    ''
  ),
  -- Donor
  (
    'd0000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'donor@mail.com',
    crypt('123456', gen_salt('bf', 10)),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Warung Makan Bu Sari", "role": "donor", "type": "UMKM", "location": "Jl. Slamet Riyadi No. 12, Solo", "contact_number": "082222222222", "whatsapp_opt_in": true}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    FALSE,
    FALSE,
    '',
    '',
    '',
    0,
    ''
  ),
  -- Volunteer
  (
    'b0000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'volunteer@mail.com',
    crypt('123456', gen_salt('bf', 10)),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Relawan Solo Berbagi", "role": "volunteer", "type": "Komunitas", "location": "Laweyan, Solo", "contact_number": "083333333333", "estimated_capacity": "50 porsi/hari", "whatsapp_opt_in": true}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    FALSE,
    FALSE,
    '',
    '',
    '',
    0,
    ''
  ),
  -- Non-Consumption
  (
    'c0000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'noncon@mail.com',
    crypt('123456', gen_salt('bf', 10)),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Maju Maggot Solo", "role": "non-consumption", "type": "Maggot", "location": "Jebres, Solo", "contact_number": "084444444444", "whatsapp_opt_in": true}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    FALSE,
    FALSE,
    '',
    '',
    '',
    0,
    ''
  ),
  -- Monitor
  (
    'e0000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'monitor@mail.com',
    crypt('123456', gen_salt('bf', 10)),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dinas Sosial Surakarta", "role": "monitor", "type": "Pemerintah", "location": "Balaikota Surakarta", "contact_number": "085555555555", "whatsapp_opt_in": true}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    FALSE,
    FALSE,
    '',
    '',
    '',
    0,
    ''
  );

-- =====================================================
-- Note: The database trigger `on_auth_user_created` 
-- automatically copies the above users into the 
-- `public.profiles` table with correct metadata!
-- =====================================================


-- =====================================================
-- 2. INSERT SURPLUS BATCH DATA
-- =====================================================
INSERT INTO surplus_batch (
  id,
  donor_id,
  name,
  category,
  quantity,
  unit,
  location_lat,
  location_lng,
  location_label,
  storage_condition,
  estimated_expiry,
  notes,
  status,
  freshness_status,
  freshness_reason,
  qr_code,
  pickup_rating
)
VALUES
  -- Batch 1: Available
  (
    'b0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000000',
    'Nasi kotak sisa rapat dinas',
    'Makanan Matang',
    20.0,
    'porsi',
    -7.5684,
    110.8215,
    'Jl. Slamet Riyadi No. 45, Solo',
    'suhu_ruang',
    NOW() + INTERVAL '4 hours',
    'Kondisi masih terbungkus rapat, lauk ayam goreng + sambal.',
    'Tersedia',
    'safe',
    'Kategori makanan matang, disimpan di suhu ruang, sisa waktu 4.0 jam, status: layak konsumsi',
    'QR-B1-SOLO',
    NULL
  ),
  -- Batch 2: Available
  (
    'b0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000000',
    'Roti manis sisa display toko',
    'Roti/Bakery',
    15.0,
    'box',
    -7.5755,
    110.8243,
    'Pasar Gede Solo',
    'suhu_ruang',
    NOW() + INTERVAL '12 hours',
    'Roti isi cokelat dan keju, diproduksi pagi ini.',
    'Tersedia',
    'safe',
    'Kategori roti/bakery, disimpan di suhu ruang, sisa waktu 12.0 jam, status: layak konsumsi',
    'QR-B2-SOLO',
    NULL
  ),
  -- Batch 3: Claimed (Waiting pickup)
  (
    'b0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000000',
    'Sayur kangkung ikat siap olah',
    'Sayuran',
    8.0,
    'kg',
    -7.5706,
    110.8249,
    'Kios Sayur Bu Sari, Pasar Klewer',
    'suhu_ruang',
    NOW() + INTERVAL '2 hours',
    'Agak layu sedikit tapi masih sangat bagus untuk dimasak.',
    'Diklaim',
    'urgent',
    'Kategori sayuran, disimpan di suhu ruang, sisa waktu 2.0 jam, status: segera diambil',
    'QR-B3-SOLO',
    NULL
  ),
  -- Batch 4: Completed (Rating 5)
  (
    'b0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000000',
    'Puding buah sisa prasmanan katering',
    'Buah Potong',
    12.0,
    'porsi',
    -7.5721,
    110.8192,
    'Gedung Pertemuan Sriwedari',
    'kulkas',
    NOW() - INTERVAL '1 hour',
    'Puding kelapa muda buah segar.',
    'Selesai',
    'safe',
    'Kategori buah potong, disimpan di kulkas, sisa waktu 0.0 jam, status: layak konsumsi',
    'QR-B4-SOLO',
    5
  ),
  -- Batch 5: Non-Consumption (Completed Maggot)
  (
    'b0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000000',
    'Sayur sawi putih layu ekstrim',
    'Sayuran',
    15.0,
    'kg',
    -7.5788,
    110.8155,
    'Pasar Legi Solo',
    'suhu_ruang',
    NOW() - INTERVAL '3 hours',
    'Sudah layu parah dan menguning, tidak layak makan manusia. Baik untuk maggot.',
    'Selesai',
    'non-consumption',
    'Kategori sayuran, disimpan di suhu ruang, sisa waktu -3.0 jam, status: alihkan ke non-konsumsi',
    'QR-B5-SOLO',
    5
  ),
  -- Batch 6: Available (Denpasar - Renon)
  (
    'b0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000000',
    'Nasi campur Bali halal sisa prasmanan',
    'Makanan Matang',
    15.0,
    'porsi',
    -8.6725,
    115.2280,
    'Renon, Denpasar Selatan',
    'suhu_ruang',
    NOW() + INTERVAL '4 hours',
    'Lauk lengkap ayam betutu, sambal embe, sayur lawar.',
    'Tersedia',
    'safe',
    'Kategori makanan matang, disimpan di suhu ruang, sisa waktu 4.0 jam, status: layak konsumsi',
    'QR-B6-DPS',
    NULL
  ),
  -- Batch 7: Available (Denpasar - Panjer)
  (
    'b0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000000',
    'Roti croissant dan Danish pastry sisa cafe',
    'Roti/Bakery',
    8.0,
    'box',
    -8.6780,
    115.2150,
    'Panjer, Denpasar Selatan',
    'suhu_ruang',
    NOW() + INTERVAL '8 hours',
    'Roti berkualitas premium dari cafe, higienis.',
    'Tersedia',
    'safe',
    'Kategori roti/bakery, disimpan di suhu ruang, sisa waktu 8.0 jam, status: layak konsumsi',
    'QR-B7-DPS',
    NULL
  ),
  -- Batch 8: Available (Denpasar - Sanur)
  (
    'b0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000000',
    'Pepaya & semangka potong segar',
    'Buah Potong',
    10.0,
    'porsi',
    -8.6820,
    115.2420,
    'Sanur, Denpasar Selatan',
    'kulkas',
    NOW() + INTERVAL '6 hours',
    'Buah potong segar sisa konsumsi rapat hotel.',
    'Tersedia',
    'safe',
    'Kategori buah potong, disimpan di kulkas, sisa waktu 6.0 jam, status: layak konsumsi',
    'QR-B8-DPS',
    NULL
  ),
  -- Batch 9: Available (Denpasar Timur)
  (
    'b0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000000',
    'Bahan sayur sop siap olah',
    'Sayuran',
    5.0,
    'kg',
    -8.6590,
    115.2310,
    'Denpasar Timur',
    'suhu_ruang',
    NOW() + INTERVAL '24 hours',
    'Sayuran segar belum dipotong, masih utuh.',
    'Tersedia',
    'safe',
    'Kategori sayuran, disimpan di suhu ruang, sisa waktu 24.0 jam, status: layak konsumsi',
    'QR-B9-DPS',
    NULL
  ),
  -- Batch 10: Available (Denpasar Barat)
  (
    'b0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000000',
    'Susu UHT & mentega kue',
    'Bahan Segar',
    12.0,
    'box',
    -8.6650,
    115.2050,
    'Denpasar Barat',
    'kulkas',
    NOW() + INTERVAL '16 hours',
    'Bahan sisa praktik memasak kelas pastry.',
    'Tersedia',
    'safe',
    'Kategori bahan segar, disimpan di kulkas, sisa waktu 16.0 jam, status: layak konsumsi',
    'QR-B10-DPS',
    NULL
  ),
  -- Batch 11: Available (Denpasar - Renon)
  (
    'b0000000-0000-0000-0000-000000000011',
    'd0000000-0000-0000-0000-000000000000',
    'Nasi kotak ayam geprek pedas',
    'Makanan Matang',
    20.0,
    'porsi',
    -8.6705,
    115.2235,
    'Renon, Denpasar Selatan',
    'suhu_ruang',
    NOW() + INTERVAL '3 hours',
    'Nasi kotak lengkap dengan lalapan dan sambal geprek.',
    'Tersedia',
    'safe',
    'Kategori makanan matang, disimpan di suhu ruang, sisa waktu 3.0 jam, status: layak konsumsi',
    'QR-B11-DPS',
    NULL
  ),
  -- Batch 12: Available (Solo - Laweyan)
  (
    'b0000000-0000-0000-0000-000000000012',
    'd0000000-0000-0000-0000-000000000000',
    'Nasi liwet Solo hangat sisa hajatan',
    'Makanan Matang',
    30.0,
    'porsi',
    -7.5630,
    110.8010,
    'Laweyan, Surakarta',
    'suhu_ruang',
    NOW() + INTERVAL '5 hours',
    'Nasi liwet gurih dengan suwiran ayam dan labu siam.',
    'Tersedia',
    'safe',
    'Kategori makanan matang, disimpan di suhu ruang, sisa waktu 5.0 jam, status: layak konsumsi',
    'QR-B12-SOLO',
    NULL
  ),
  -- Batch 13: Available (Solo - Jebres)
  (
    'b0000000-0000-0000-0000-000000000013',
    'd0000000-0000-0000-0000-000000000000',
    'Roti Mandarin sisa display toko',
    'Roti/Bakery',
    10.0,
    'box',
    -7.5590,
    110.8420,
    'Jebres, Surakarta',
    'suhu_ruang',
    NOW() + INTERVAL '10 hours',
    'Roti khas Solo yang legendaris, masih empuk.',
    'Tersedia',
    'safe',
    'Kategori roti/bakery, disimpan di suhu ruang, sisa waktu 10.0 jam, status: layak konsumsi',
    'QR-B13-SOLO',
    NULL
  ),
  -- Batch 15: Available (Solo - Pasar Kliwon)
  (
    'b0000000-0000-0000-0000-000000000014',
    'd0000000-0000-0000-0000-000000000000',
    'Semangka merah potong manis',
    'Buah Potong',
    8.0,
    'porsi',
    -7.5810,
    110.8280,
    'Pasar Kliwon, Surakarta',
    'kulkas',
    NOW() + INTERVAL '4 hours',
    'Semangka manis segar siap santap.',
    'Tersedia',
    'safe',
    'Kategori buah potong, disimpan di kulkas, sisa waktu 4.0 jam, status: layak konsumsi',
    'QR-B14-SOLO',
    NULL
  ),
  -- Batch 16: Available (Solo - Banjarsari)
  (
    'b0000000-0000-0000-0000-000000000015',
    'd0000000-0000-0000-0000-000000000000',
    'Sayur bayam & wortel segar utuh',
    'Sayuran',
    15.0,
    'kg',
    -7.5510,
    110.8210,
    'Banjarsari, Surakarta',
    'suhu_ruang',
    NOW() + INTERVAL '18 hours',
    'Sayuran hijau mentah segar siap masak.',
    'Tersedia',
    'safe',
    'Kategori sayuran, disimpan di suhu ruang, sisa waktu 18.0 jam, status: layak konsumsi',
    'QR-B15-SOLO',
    NULL
  ),
  -- Batch 17: Available (Solo - Grogol)
  (
    'b0000000-0000-0000-0000-000000000016',
    'd0000000-0000-0000-0000-000000000000',
    'Tempe dan tahu bacem Solo',
    'Makanan Matang',
    25.0,
    'porsi',
    -7.6020,
    110.8120,
    'Grogol, Sukoharjo',
    'suhu_ruang',
    NOW() + INTERVAL '6 hours',
    'Baceman manis khas Jawa Tengah, sudah matang.',
    'Tersedia',
    'safe',
    'Kategori makanan matang, disimpan di suhu ruang, sisa waktu 6.0 jam, status: layak konsumsi',
    'QR-B16-SOLO',
    NULL
  );

-- =====================================================
-- 3. INSERT RECURRING TEMPLATES
-- Mapped template IDs to valid hex starts with 'f0000...'
-- =====================================================
INSERT INTO surplus_template (
  id,
  donor_id,
  name,
  category,
  quantity,
  unit,
  storage_condition,
  estimated_hours,
  notes,
  schedule_days,
  schedule_time,
  paused
)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000000',
    'Paket Nasi Sayur Sisa Warung Harian',
    'Makanan Matang',
    10.0,
    'porsi',
    'suhu_ruang',
    4.0,
    'Lauk sayur campur dan tempe/tahu goreng.',
    ARRAY[1,2,3,4,5], -- Sen s/d Jum
    '15:00',
    FALSE
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000000',
    'Aneka Donat & Roti Manis Kering',
    'Roti/Bakery',
    12.0,
    'box',
    'suhu_ruang',
    12.0,
    'Pasti aman dikonsumsi hingga besok siang.',
    ARRAY[6,0], -- Sab & Min
    '21:00',
    TRUE
  );

-- =====================================================
-- 4. INSERT DISTRIBUTION LOGS (Audit Trail)
-- =====================================================
INSERT INTO distribution_log (
  id,
  batch_id,
  volunteer_id,
  status,
  timestamp,
  notes
)
VALUES
  -- Log Batch 3 (Claimed)
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id (volunteer@mail.com)
    'Tersedia',
    NOW() - INTERVAL '3 hours',
    'Batch makanan dibuat dan tersedia untuk diklaim.'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id (volunteer@mail.com)
    'Diklaim',
    NOW() - INTERVAL '1 hour',
    'Batch makanan diklaim oleh Relawan Solo Berbagi.'
  ),
  -- Log Batch 4 (Completed)
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Tersedia',
    NOW() - INTERVAL '6 hours',
    'Tersedia'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Diklaim',
    NOW() - INTERVAL '5 hours',
    'Diklaim oleh Relawan Solo Berbagi'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Diambil',
    NOW() - INTERVAL '3 hours',
    'Diambil dari lokasi Sriwedari'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Selesai',
    NOW() - INTERVAL '2 hours',
    'Selesai dibagikan di Panti Asuhan Kratonan Solo'
  ),
  -- Log Batch 5 (Noncon completed)
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000000', -- volunteer_id (noncon@mail.com)
    'Tersedia',
    NOW() - INTERVAL '8 hours',
    'Tersedia'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Diklaim',
    NOW() - INTERVAL '6 hours',
    'Diklaim oleh Maju Maggot Solo'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Diambil',
    NOW() - INTERVAL '5 hours',
    'Diambil dari lokasi Pasar Legi'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000000', -- volunteer_id
    'Selesai',
    NOW() - INTERVAL '4 hours',
    'Selesai diumpankan ke budidaya maggot BSF'
  );

-- =====================================================
-- 5. INSERT NOTIFICATION LOGS
-- =====================================================
INSERT INTO notification_log (
  id,
  batch_id,
  sender_id,
  event_type,
  target_number,
  sent_at
)
VALUES
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000000',
    'Surplus Pangan Baru',
    '083333333333,084444444444',
    NOW() - INTERVAL '4 hours'
  ),
  (
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000000',
    'Urgensi Kelayakan Makanan',
    '083333333333',
    NOW() - INTERVAL '2 hours'
  );

-- =====================================================
-- 6. INSERT BENEFICIARIES (Drop-off locations)
-- =====================================================
INSERT INTO beneficiaries (id, name, location_label, location_lat, location_lng, contact_number)
VALUES
  (uuid_generate_v4(), 'Panti Asuhan PAAY Surakarta', 'Jl. Slamet Riyadi No. 112, Kerten, Laweyan, Surakarta', -7.5672, 110.8120, '081234567801'),
  (uuid_generate_v4(), 'Panti Asuhan Pamardi Kasih', 'Jl. Kolonel Sutarto No. 15, Jebres, Surakarta', -7.5580, 110.8350, '081234567802'),
  (uuid_generate_v4(), 'Yayasan Aisyiyah Surakarta', 'Jl. KH Ahmad Dahlan No. 34, Keprabon, Surakarta', -7.5620, 110.8220, '081234567803'),
  (uuid_generate_v4(), 'Pondok Yatim Solo Peduli', 'Jl. Danudirja Setiabudi No. 10, Gilingan, Banjarsari, Surakarta', -7.5510, 110.8150, '081234567804'),
  (uuid_generate_v4(), 'Panti Asuhan Tat Twam Asi Denpasar', 'Jl. Jaya Giri VIII No. 14, Renon, Denpasar Selatan', -8.6732, 115.2260, '081234567805'),
  (uuid_generate_v4(), 'Panti Asuhan Asy Syifa Denpasar', 'Jl. Cargo Indah No. 2, Denpasar Barat', -8.6510, 115.2010, '081234567806'),
  (uuid_generate_v4(), 'Panti Asuhan Salam Bali', 'Jl. Bypass Ngurah Rai No. 200, Sanur, Denpasar Selatan', -8.6850, 115.2420, '081234567807'),
  (uuid_generate_v4(), 'Panti Asuhan Evangeline Booth', 'Jl. WR Supratman No. 56, Denpasar Timur', -8.6590, 115.2310, '081234567808');
