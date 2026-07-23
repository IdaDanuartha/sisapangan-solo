# SisaPangan Solo 🍲 — Platform Penyelamatan Pangan Solo Raya

**SisaPangan Solo** adalah platform digital inovatif yang dirancang untuk mengatasi masalah pemborosan makanan (*food waste*) di kawasan Solo Raya (Surakarta dan sekitarnya). Platform ini menghubungkan secara real-time para donor pangan (UMKM kuliner, restoran, katering, hotel) dengan relawan sosial, lembaga penerima manfaat (panti asuhan, komunitas kurang mampu), serta pengelola limbah organik (untuk pakan ternak atau pembuatan pupuk kompos).

Proyek ini dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan **Supabase** sebagai Backend-as-a-Service (BaaS) dengan sistem keamanan data tingkat tinggi (*Row Level Security*).

---

## 🌟 Fitur Utama

### 👥 1. Manajemen Multi-Peran (Multi-Role Management)
Sistem membagi pengguna ke dalam 5 peran utama yang terintegrasi secara dinamis melalui [AppShell.tsx](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/src/components/app/AppShell.tsx):
*   **Donor (UMKM Kuliner, Restoran, Katering)**: Mengunggah data sisa pangan/surplus makanan (baik sekali posting maupun terjadwal secara rutin).
*   **Relawan (Volunteer)**: Mengklaim batch surplus, melakukan penjemputan (*pickup*), dan menyalurkannya ke penerima manfaat.
*   **Pengelola Non-Konsumsi (Non-Consumption)**: Mengambil makanan sisa yang sudah tidak layak konsumsi manusia untuk dialihkan menjadi pakan ternak, budidaya maggot, atau pembuatan kompos.
*   **Monitor**: Dashboard khusus untuk memantau metrik penyelamatan pangan serta dampak sosial/lingkungan.
*   **Administrator**: Mengelola verifikasi akun relawan/pengelola non-konsumsi dan mengonfigurasi titik drop-off.

### 🧪 2. Freshness & Risk Engine (Kalkulator Kesegaran)
Algoritma evaluasi kesegaran sisa pangan berbasis aturan (*rule-based*) untuk menjamin kelayakan makanan sebelum didistribusikan. Kalkulasi ini menggunakan parameter kategori makanan, kondisi penyimpanan, dan sisa waktu kadaluarsa. Logika lengkap dapat dilihat pada [freshness-score.ts](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/src/lib/freshness-score.ts).

### 🤖 3. Penganalisis Kesegaran Berbasis AI (AI Freshness Analyzer)
Integrasi dengan **Google Gemini AI** (model `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) dan **OpenAI GPT-4o-mini** untuk menganalisis foto makanan yang diunggah oleh donor secara real-time. Fitur ini secara otomatis mendeteksi nama makanan, estimasi kategori, masa simpan, serta memberikan rekomendasi pemanfaatan dalam Bahasa Indonesia. Rute API dapat ditemukan di [analyze/route.ts](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/src/app/api/ai/analyze/route.ts) dan [recipe/route.ts](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/src/app/api/ai/recipe/route.ts).

### 🗺️ 4. Peta Interaktif & Navigasi Rute (Interactive Maps)
Pencarian lokasi surplus makanan terdekat berbasis radius geolocation menggunakan **Leaflet** map. Membantu relawan melihat persebaran donor pangan secara visual serta memandu rute penjemputan hingga titik distribusi (*drop-off*).

### 💬 5. Notifikasi WhatsApp & Audit Trail
Integrasi dengan **Fonnte WhatsApp API** untuk mengirim notifikasi penjemputan dan klaim pangan secara instan kepada donor maupun relawan. Seluruh aktivitas platform dicatat dalam sistem audit trail menggunakan modul [activity.ts](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/src/lib/activity.ts).

### 📱 6. Validasi Transaksi dengan Kode QR
Sistem verifikasi tanpa kontak fisik (*contactless*) di mana relawan memindai QR code unik yang digenerasikan oleh sistem pada sisi donor untuk menandai bahwa makanan telah sukses diambil (*picked up*) atau diselesaikan (*completed*).

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

*   **Framework Utama**: Next.js 16.2.10 (App Router) & React 19.2.4
*   **Bahasa Pemrograman**: TypeScript
*   **Styling**: Tailwind CSS v4 & PostCSS
*   **Backend & Autentikasi**: Supabase SSR (`@supabase/ssr` & `@supabase/supabase-js`)
*   **Manajemen Status**: Zustand 5.0.14
*   **Peta Interaktif**: Leaflet 1.9.4 & `@types/leaflet`
*   **Validasi & Form**: React Hook Form & Zod
*   **Animasi UI**: GSAP (GreenSock Animation Platform)
*   **Generasi Kode QR**: `qrcode`

---

## 📂 Struktur Direktori Utama

```bash
sisapangan-solo/
├── .env.example              # Template variabel lingkungan
├── supabase/
│   ├── schema.sql            # Skema lengkap database & RLS
│   └── seed.sql              # Data sampel untuk demonstrasi
├── src/
│   ├── app/                  # Halaman aplikasi (Next.js App Router)
│   │   ├── api/              # API Routes (termasuk AI analyzer & recipe generator)
│   │   ├── app/              # Dashboard internal berdasarkan peran user
│   │   ├── auth/             # Proses autentikasi
│   │   └── globals.css       # Pengaturan CSS global & Tailwind v4
│   ├── components/           # Komponen UI reusable & layouts
│   │   ├── app/              # Komponen internal app (AppShell)
│   │   ├── landing/          # Komponen landing page
│   │   └── ui/               # Komponen dasar (Button, Modal, Badge, dll)
│   ├── lib/                  # Utilitas, helper, dan integrasi Supabase
│   │   ├── activity.ts       # Logger aktivitas pengguna
│   │   └── freshness-score.ts# Logika bisnis perhitungan kesegaran makanan
│   └── proxy.ts              # Utilitas proxy
└── package.json              # Daftar ketergantungan (dependencies) proyek
```

---

## 🗄️ Skema Basis Data & Keamanan (RLS)

SisaPangan Solo menggunakan Supabase PostgreSQL dengan konfigurasi Row Level Security (RLS) untuk menjamin keamanan data sensitif. Skema basis data lengkap dapat dilihat di [schema.sql](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/supabase/schema.sql).

Berikut adalah tabel-tabel utama:
1.  **`profiles`**: Menyimpan profil pengguna, nomor WhatsApp, peran (*role*), dan status verifikasi.
2.  **`surplus_batch`**: Menyimpan detail postingan surplus pangan, kuantitas, lokasi koordinat, kesegaran, status klaim, dan kode QR.
3.  **`surplus_template`**: Template untuk donasi terjadwal/rutin (misal katering yang selalu memiliki sisa makanan setiap hari Jumat).
4.  **`distribution_log`**: Catatan riwayat penjemputan dan distribusi makanan.
5.  **`notification_log`**: Log notifikasi WhatsApp yang dikirimkan.
6.  **`user_activity_log`**: Audit log untuk memantau aktivitas pengguna dalam aplikasi.
7.  **`beneficiaries`**: Data panti asuhan atau titik drop-off resmi.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org) (versi 18 atau lebih baru)
*   Package manager `npm` atau `pnpm` (disarankan menggunakan `pnpm`)

### 2. Kloning Proyek & Instal Dependensi
Jalankan perintah berikut pada terminal Anda:
```bash
# Clone repositori (jika clone via Git)
git clone <url-repositori-sisapangan-solo>
cd sisapangan-solo

# Instal seluruh package dependensi
pnpm install
# atau menggunakan npm
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin file [.env.example](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/.env.example) menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka file `.env.local` dan lengkapi nilai variabel berikut:
*   `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key dari proyek Supabase Anda.
*   `FONNTE_TOKEN`: API Token dari layanan Fonnte (untuk pengiriman WhatsApp).
*   `GEMINI_API_KEY`: API Key dari Google AI Studio (untuk fitur AI kesegaran pangan).
*   `OPENAI_API_KEY`: (Opsional) API Key OpenAI jika ingin menggunakan model GPT-4o-mini.

### 4. Setup Database Supabase
1.  Buat proyek baru di [Supabase Console](https://database.new).
2.  Buka menu **SQL Editor** pada dashboard Supabase.
3.  Salin seluruh konten dari file [schema.sql](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/supabase/schema.sql) dan jalankan (*Run*) untuk membuat tabel, relasi, pemicu (*triggers*), kebijakan RLS, serta konfigurasi storage bucket.
4.  (Opsional) Jalankan konten dari [seed.sql](file:///d:/Danuartha/Programming/Web/Nextjs/Competition/sisapangan-solo/supabase/seed.sql) di SQL Editor untuk mengisi data demo/awal proyek.

### 5. Jalankan Development Server
Jalankan perintah di bawah ini untuk memulai server lokal:
```bash
pnpm dev
# atau menggunakan npm
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) melalui browser Anda untuk melihat aplikasi berjalan.

### 6. Build Produksi
Untuk melakukan build aplikasi sebelum deployment:
```bash
pnpm build
pnpm start
```

---

## 🌐 Deployment
Aplikasi ini dioptimalkan untuk di-deploy ke platform **Vercel** dengan konfigurasi zero-config.
Hubungkan repositori GitHub Anda ke Vercel, masukkan seluruh *Environment Variables* dari `.env.local` ke dashboard Vercel, lalu jalankan proses deploy.

---

## 💚 Berkontribusi
Jika Anda ingin berkontribusi dalam pengembangan aplikasi penyelamatan pangan Solo Raya ini, silakan membuat *Pull Request* atau membuka *Issue* baru pada repositori proyek. Mari bersama-sama kurangi *food waste* demi masa depan Solo Raya yang lebih hijau! 🌿
