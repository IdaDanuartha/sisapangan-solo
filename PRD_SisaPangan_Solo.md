# Product Requirements Document
## SisaPangan Solo, Sistem Koordinasi Food Rescue untuk Solo Raya

Versi 1.0, disusun berdasarkan Proposal BYTESFEST 2026, TIM REGEX

---

## 1. Ringkasan Produk

SisaPangan Solo adalah platform koordinasi food rescue yang mempertemukan donor pangan (UMKM kuliner, restoran, katering, pasar), relawan, penerima manfaat, pengelola pangan non-konsumsi, dan pemantau daerah dalam satu alur kerja digital. Produk ini bukan aplikasi donasi biasa. Fokus utamanya adalah triase kelayakan pangan berbasis waktu, pencocokan pihak terdekat, dan pengukuran dampak yang bisa dibuktikan lewat data.

Untuk versi website, produk ini terdiri dari dua bagian besar:

1. **Marketing site / landing page**, tempat calon donor, relawan, dan mitra memahami nilai produk dan mendaftar.
2. **Aplikasi web multi-role** (donor, relawan/penerima, pengelola non-konsumsi, pemantau/admin), tempat alur inti food rescue berjalan.

### 1.1 Tujuan Produk

- Memangkas waktu antara surplus pangan ditemukan dan diambil.
- Memberi prioritas otomatis lewat Freshness and Risk Score, supaya makanan berisiko tinggi waktu tidak terlambat ditangani.
- Menyediakan bukti distribusi yang bisa dilacak lewat QR, supaya donor dan penerima sama-sama merasa aman.
- Menyajikan dashboard dampak yang bisa langsung dipakai untuk laporan ke pemerintah daerah atau mitra.

### 1.2 Yang Bukan Bagian dari MVP

Ditulis di sini supaya scope tidak melebar saat implementasi.

- Tidak ada payment gateway atau transaksi uang.
- Tidak menjadi lembaga penyalur bantuan resmi.
- Tidak menyimpan data sensitif penerima secara mendalam, cukup data operasional untuk pencocokan dan pelacakan.
- Freshness and Risk Score adalah alat bantu prioritas, bukan pengganti pemeriksaan manual di lapangan.

---

## 2. Target Pengguna

| Role | Siapa | Kebutuhan Utama di Website |
|---|---|---|
| Donor | UMKM kuliner, restoran, hotel, katering, kantin, pasar, penyelenggara acara | Form cepat untuk posting surplus, status pengambilan real-time, riwayat distribusi |
| Volunteer / Receiver | Relawan food sharing, komunitas sosial, panti, dapur umum, posyandu | Daftar pickup prioritas, rute ke lokasi donor, klaim satu tombol |
| Pengelola non-konsumsi | Peternak, pengelola maggot, bank sampah organik | Akses ke batch berstatus tidak layak konsumsi manusia |
| Pemantau / Pemerintah daerah / Mitra | Dinas terkait, organisasi mitra seperti Gita Pertiwi | Dashboard agregat, pola surplus, volume terselamatkan |
| Admin internal | Tim REGEX / operator platform | Moderasi data, verifikasi akun, monitoring sistem |

Untuk MVP, tiga role yang wajib punya alur lengkap di website adalah **Donor**, **Volunteer/Receiver**, dan **Pemantau (dashboard dampak)**. Pengelola non-konsumsi bisa memakai antarmuka yang sama dengan Volunteer, dibedakan lewat filter kategori.

---

## 3. Filosofi Desain

### 3.1 Prinsip Inti

**Jelas sebelum indah.** Ini adalah alat kerja lapangan, dipakai orang yang buru-buru saat surplus pangan ditemukan. Setiap keputusan visual harus mempercepat pembacaan status, bukan menghiasnya.

**Urgensi punya bahasa visual sendiri.** Sistem status hijau, kuning, merah adalah bagian dari fungsi produk, bukan dekorasi. Warna status ini konsisten di semua tempat, dari badge kecil di kartu sampai peta.

**Hangat, bukan korporat.** Produk ini bicara ke UMKM kuliner dan relawan komunitas, bukan enterprise SaaS. Nuansa desain mengambil kehangatan dari pangan dan komunitas lokal Solo, tapi tetap modern dan rapi, bukan bergaya tradisional atau ramai.

**Satu sistem, banyak peran.** Donor, relawan, dan pemantau memakai shell antarmuka yang sama, hanya beda konten dashboard. Ini menjaga konsistensi dan mempercepat development.

**Tidak generik.** Hindari layout template SaaS yang terlalu sering dipakai, seperti hero dengan gradient ungu-biru dan ilustrasi 3D generik. Gunakan kombinasi warna dan tipografi yang punya karakter, foto/ilustrasi yang terasa lokal dan manusiawi, serta detail interaksi yang niat, bukan asal ditempel.

### 3.2 Color Palette

Palet dibangun dari dua ide, kehangatan pangan dan kepercayaan sistem. Warna dasar terasa organik dan approachable, sementara warna status memakai sistem semaphore yang universal supaya bisa dibaca sekilas.

**Warna Primer**

| Nama | Hex | Penggunaan |
|---|---|---|
| Harvest Green | `#2F6E4F` | Warna brand utama, navigasi, CTA utama, elemen aktif |
| Harvest Green Dark | `#1E4A35` | Hover state, teks pada background terang, footer |
| Harvest Green Light | `#E4F0E8` | Background section, badge sukses, highlight lembut |

**Warna Sekunder / Aksen**

| Nama | Hex | Penggunaan |
|---|---|---|
| Warm Amber | `#E88C2D` | Aksen hangat, ikon pangan, elemen interaktif sekunder, ilustrasi |
| Amber Soft | `#FBEBD8` | Background kartu, section alternatif |
| Clay Terracotta | `#C1502E` | Aksen dekoratif opsional, dipakai tipis untuk variasi, bukan status |

**Warna Netral**

| Nama | Hex | Penggunaan |
|---|---|---|
| Ink | `#1B1F1C` | Teks utama |
| Slate | `#5B655D` | Teks sekunder, caption |
| Mist | `#9AA39C` | Placeholder, border, teks disabled |
| Fog | `#F4F6F3` | Background utama aplikasi |
| Paper | `#FFFFFF` | Card, modal, surface terangkat |

**Warna Status Kelayakan Pangan** (dipakai konsisten sebagai bagian dari fungsi, bukan branding)

| Status | Nama | Hex | Arti |
|---|---|---|---|
| Aman | Fresh Green | `#3AA65A` | Layak disalurkan ke manusia |
| Segera | Urgent Amber | `#F0A93B` | Perlu segera diambil |
| Non-konsumsi | Alert Red | `#D14343` | Diarahkan ke pakan, maggot, atau kompos |

Catatan penting: warna status ini sengaja dibuat berbeda saturasi dan tone dari warna brand (Harvest Green vs Fresh Green), supaya badge status tidak tertukar dengan elemen navigasi atau branding saat sistem dibaca cepat.

**Dark mode** tidak wajib di MVP. Jika dikerjakan di fase lanjutan, gunakan Ink sebagai background dan naikkan lightness warna status sekitar 10 persen supaya tetap kontras.

### 3.3 Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Display / Headline (landing page, judul besar) | **Instrument Serif** | Karakter editorial, hangat, dan manusiawi, cocok untuk storytelling di landing page tanpa terasa seperti template startup generik |
| UI / Body / Dashboard | **Inter** | Netral, sangat legible di ukuran kecil, standar industri untuk dashboard dan data-dense screen |
| Angka / Metric besar (dashboard dampak) | **Inter Tight** atau **Inter** dengan `font-variant-numeric: tabular-nums` | Angka sejajar rapi saat berubah, penting untuk dashboard real-time |

Skala tipografi disarankan memakai rasio 1.25 (major third) dari base 16px, dengan headline landing page bisa naik sampai 56-72px di desktop.

Hindari memakai font display untuk label UI kecil seperti badge status atau tombol, karena serif di ukuran kecil menurunkan legibility di layar mobile.

### 3.4 Ikon dan Ilustrasi

- Semua ikon fungsional memakai **Lucide Icons**, stroke width konsisten 1.5-2px, tanpa fill kecuali untuk state aktif.
- Tidak ada emoji di antarmuka atau copywriting.
- Ilustrasi custom (jika ada, misalnya di empty state atau landing page) memakai gaya line-art sederhana dengan aksen warna dari palet di atas, bukan ilustrasi 3D generik atau ilustrasi bergaya corporate memphis yang sudah terlalu umum di produk SaaS 2024-2025.
- Foto (jika dipakai di landing page) sebaiknya foto asli aktivitas food rescue atau UMKM kuliner lokal, bukan stock photo bertema generik "orang tersenyum sambil pegang laptop".

### 3.5 Spacing, Radius, dan Shadow

- Base spacing unit 4px, skala umum yang dipakai: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 8px untuk elemen kecil (input, badge), 12-16px untuk card, 24px untuk modal besar. Konsisten, jangan campur radius tajam dan sangat bulat dalam satu layar.
- Shadow dipakai minim, hanya untuk elevasi fungsional (dropdown, modal, floating action button). Gunakan shadow lembut dengan opacity rendah, bukan shadow gelap tajam bergaya Material lama.

---

## 4. Arsitektur Informasi

### 4.1 Sitemap

```
/
  Landing Page (public)
    - Hero
    - Masalah (data food loss and waste)
    - Cara Kerja
    - Fitur Utama
    - Dampak / Social Proof
    - CTA Daftar

/login
/register
  - Register Donor
  - Register Volunteer/Receiver
  - Register Pengelola Non-konsumsi

/app  (butuh login, role-based)
  /app/dashboard              -> beda konten per role
  /app/surplus/tambah         -> Donor
  /app/surplus/terdekat       -> Volunteer/Receiver, peta + list
  /app/surplus/:id            -> Detail batch, status, QR
  /app/pickup/rute            -> Volunteer, rute ke lokasi
  /app/riwayat                -> Semua role, riwayat transaksi mereka
  /app/dampak                 -> Impact dashboard (Pemantau + agregat publik terbatas)
  /app/profil
  /app/notifikasi

/scan/:qrcode                 -> Halaman publik hasil scan QR traceability
```

### 4.2 Role-based Navigation

Shell aplikasi sama untuk semua role (sidebar di desktop, bottom navigation di mobile), tapi item menu menyesuaikan:

- **Donor**: Dashboard, Tambah Surplus, Riwayat, Profil
- **Volunteer/Receiver**: Dashboard, Surplus Terdekat, Rute Pickup, Riwayat, Profil
- **Pengelola non-konsumsi**: sama seperti Volunteer, dengan filter default kategori non-konsumsi
- **Pemantau/Admin**: Dashboard Dampak, Data Surplus (read-only map), Manajemen Akun (khusus admin), Profil

---

## 5. Landing Page, Spesifikasi Detail

Landing page adalah pintu masuk utama untuk akuisisi donor dan relawan baru, sekaligus alat presentasi saat demo hackathon.

### 5.1 Struktur Section

1. **Navbar**
   Logo, anchor link (Cara Kerja, Fitur, Dampak), tombol Masuk dan Daftar. Sticky, berubah background dari transparan ke solid saat scroll melewati hero.

2. **Hero**
   Headline besar dengan font Instrument Serif, satu kalimat sub-headline yang menjelaskan produk dalam bahasa manusia, dua CTA (Daftar sebagai Donor, Daftar sebagai Relawan), dan visual pendukung berupa mockup dashboard atau ilustrasi alur surplus ke penerima.
   Animasi GSAP: elemen headline dan CTA fade-up bertahap saat halaman dimuat (bukan saat scroll), dengan stagger ringan 80-100ms antar elemen.

3. **Masalah**
   Menampilkan 2-3 statistik kunci dari proposal (23-48 juta ton per tahun, Rp213-551 triliun kerugian, 1,05 miliar ton food waste global) dalam bentuk angka besar dengan animasi count-up saat section masuk viewport.
   Animasi GSAP: `ScrollTrigger` memicu count-up dan fade-in card statistik saat 40 persen section terlihat.

4. **Cara Kerja**
   Timeline horizontal (desktop) atau vertikal (mobile) menampilkan 4 langkah: Donor posting surplus, sistem beri skor kelayakan, matching ke penerima terdekat, distribusi tercatat dengan QR.
   Animasi GSAP: setiap step muncul berurutan dengan garis penghubung yang "tergambar" (stroke-dashoffset animation) mengikuti scroll progress.

5. **Fitur Utama**
   Grid 3 kolom (desktop) berisi 5-6 fitur inti (Freshness Score, Smart Matching, QR Traceability, Impact Dashboard, Volunteer Routing), tiap kartu punya ikon Lucide, judul, dan deskripsi singkat.
   Animasi GSAP: card fade-up dengan stagger saat scroll masuk, hover state mengangkat card ringan (translateY -4px + shadow).

6. **Dampak / Bukti Lokal**
   Menampilkan konteks lokal Solo Raya, bisa memuat kutipan singkat dari data pendukung proposal soal ekosistem food sharing yang sudah ada di Surakarta, diposisikan sebagai kolaborasi, bukan kompetisi.

7. **CTA Akhir**
   Ajakan mendaftar dengan dua jalur jelas (Donor / Relawan), background memakai Harvest Green Dark supaya kontras dengan section sebelumnya.

8. **Footer**
   Tautan penting, kontak tim, dan atribusi TIM REGEX.

### 5.2 Prinsip Animasi Scroll (GSAP)

- Gunakan `ScrollTrigger` dengan `once: false` hanya untuk elemen dekoratif, dan `once: true` untuk elemen konten supaya tidak mengganggu saat user scroll naik-turun berulang.
- Durasi animasi 400-700ms, easing `power2.out` untuk masuk, `power1.inOut` untuk elemen yang bergerak mengikuti scroll progress langsung.
- Hindari animasi yang menahan scroll (scroll-jacking) atau membuat teks tidak terbaca sebelum animasi selesai. Semua teks penting harus tetap terbaca dari frame pertama, animasi hanya memperhalus kemunculan.
- Hormati `prefers-reduced-motion`, matikan animasi non-esensial jika user mengaktifkan setting tersebut di device mereka.

---

## 6. Autentikasi

### 6.1 Login

Form sederhana: email/telepon dan password, opsi "lupa password", link ke halaman register. Setelah login, redirect ke `/app/dashboard` sesuai role.

### 6.2 Register

Register memakai pemilihan role di awal (Donor / Volunteer-Receiver / Pengelola Non-konsumsi), karena field yang dibutuhkan berbeda:

- **Donor**: nama usaha/individu, jenis (UMKM, restoran, katering, pasar, individu, lainnya), lokasi/alamat, nomor kontak.
- **Volunteer/Receiver**: nama, jenis (relawan individu, komunitas, panti, dapur umum, posyandu), lokasi operasional, kapasitas perkiraan.
- **Pengelola non-konsumsi**: nama, jenis pengelolaan (maggot, ternak, kompos, bank sampah organik), lokasi.

Field minimal untuk MVP, cukup untuk matching dan verifikasi dasar, tidak perlu KYC berat. Verifikasi akun bisa berupa status "belum terverifikasi" yang tetap bisa dipakai terbatas, sambil admin melakukan verifikasi manual di background.

---

## 7. Spesifikasi Fitur Inti

### 7.1 Donor Dashboard

**Tujuan**: donor melihat status surplus yang sudah diposting dan cepat menambah surplus baru.

**Isi**:
- Ringkasan cepat di atas: jumlah batch aktif, total kg terselamatkan sepanjang waktu, jumlah pending pickup.
- Tombol utama "Tambah Surplus Pangan", selalu terlihat (floating action button di mobile).
- List/grid card batch surplus terbaru, tiap card menampilkan foto, nama makanan, badge status kelayakan, status distribusi (tersedia, diklaim, diambil, selesai), dan waktu tersisa sebelum batas layak konsumsi.

### 7.2 Tambah Surplus Pangan

**Tujuan**: form cepat, idealnya bisa diisi di bawah 90 detik di lapangan.

**Field**:
- Foto makanan (wajib, bisa multi foto)
- Nama/jenis makanan
- Kategori (matang, roti/bakery, buah potong, sayuran, bahan segar, lainnya)
- Jumlah (dengan satuan: porsi, kg, box)
- Lokasi (auto-detect GPS dengan opsi edit manual pin di peta)
- Estimasi waktu layak konsumsi (date-time picker, atau pilihan cepat: 2 jam, 6 jam, 24 jam)
- Kondisi tambahan (opsional: catatan bebas)

**Perilaku**:
- Setelah submit, sistem langsung menghitung Freshness and Risk Score dan menampilkan hasilnya (hijau/kuning/merah) sebelum konfirmasi final, supaya donor tahu ke mana arah distribusinya.
- Draft otomatis tersimpan di local storage jika koneksi terputus saat pengisian, sesuai kebutuhan lapangan yang disebut di proposal.

### 7.3 Freshness and Risk Score (tampilan)

Bukan fitur AI berat, tapi rule-based scoring yang ditampilkan sebagai badge dengan warna status (lihat 3.2). Tampilkan juga alasan singkat skor tersebut (contoh: "Kategori makanan matang, sisa waktu 3 jam, status: segera diambil"), supaya donor dan relawan paham logikanya, bukan kotak hitam.

### 7.4 Surplus Terdekat (Volunteer/Receiver)

**Tujuan**: relawan/penerima melihat surplus di sekitar mereka dan memutuskan cepat mana yang diklaim.

**Layout**: split view di desktop (peta di kanan, list di kiri), tab-switch peta/list di mobile.

**Peta**: marker berwarna sesuai status kelayakan, klik marker membuka preview card. Peta memakai Leaflet.js dengan OpenStreetMap sesuai stack di proposal.

**List**: diurutkan default berdasarkan kombinasi urgensi dan jarak (bukan jarak saja), dengan filter kategori makanan, status, dan radius jarak.

**Aksi**: tombol "Klaim" langsung dari card atau dari detail batch, dengan konfirmasi ringan sebelum status berubah jadi "diklaim".

### 7.5 Detail Batch dan QR Traceability

Halaman detail per batch menampilkan riwayat lengkap: asal donor, waktu posting, skor kelayakan, siapa yang klaim, waktu pickup, penerima akhir, dan status akhir. QR code batch mengarah ke halaman publik `/scan/:qrcode` yang menampilkan ringkasan riwayat ini, bisa dipindai siapa saja untuk transparansi tanpa perlu login.

### 7.6 Rute Pickup (Volunteer)

List pickup yang sudah diklaim relawan tersebut, diurutkan berdasarkan urgensi, dengan tombol buka rute di peta (bisa deep-link ke Google Maps untuk navigasi turn-by-turn, karena membangun routing engine sendiri di luar scope MVP).

### 7.7 Impact Dashboard

**Tujuan**: metrik yang bisa langsung dipakai untuk laporan ke pemerintah daerah atau juri hackathon.

**Metrik utama** (kartu besar di atas):
- Total kg pangan terselamatkan
- Estimasi porsi makanan
- Jumlah titik surplus aktif
- Rata-rata waktu rescue (dari posting sampai diambil)

**Visualisasi pendukung**:
- Grafik tren kg terselamatkan per minggu/bulan
- Peta heatmap titik surplus (opsional, fase lanjutan)
- Breakdown kategori makanan yang paling sering surplus

Role Pemantau melihat data agregat seluruh platform. Role Donor dan Volunteer melihat versi personal (kontribusi mereka sendiri) di halaman Riwayat, bukan di Impact Dashboard penuh.

### 7.8 Riwayat

List transaksi/batch yang relevan dengan role user (donor: batch yang mereka posting, volunteer: batch yang mereka klaim/ambil), dengan filter status dan rentang tanggal.

### 7.9 Notifikasi

Notifikasi in-app minimal untuk MVP: surplus baru sesuai radius/kategori favorit (untuk volunteer), status batch berubah (untuk donor), pengingat batch mendekati batas waktu layak konsumsi. Push notification browser opsional di fase lanjutan.

---

## 8. Design System, Komponen Utama

| Komponen | Catatan Implementasi |
|---|---|
| Button | 3 varian: primary (Harvest Green solid), secondary (outline), ghost (text only). Ukuran sm/md/lg. Radius 8px. |
| Status Badge | Pill shape, warna sesuai 3.2, selalu dipasangkan dengan label teks, tidak hanya warna, untuk aksesibilitas |
| Card | Radius 12-16px, shadow tipis, padding 16-24px |
| Input/Form Field | Label di atas field, border 1px Mist, focus state Harvest Green, error state Alert Red dengan pesan di bawah field |
| Map Marker | Custom marker Lucide-style icon dengan warna status, ukuran membesar saat hover/selected |
| Navigation Sidebar (desktop) / Bottom Nav (mobile) | Icon Lucide + label, item aktif memakai Harvest Green Light sebagai background |
| Modal | Radius 24px, overlay dengan backdrop blur ringan |
| Toast/Notification | Muncul dari atas kanan (desktop) atau atas (mobile), auto-dismiss 4-5 detik |
| Empty State | Ilustrasi line-art sederhana + copy yang membantu, bukan sekadar "tidak ada data" |

---

## 9. Responsiveness

Breakpoint yang disarankan (mengikuti konvensi Tailwind CSS, sesuai stack di proposal):

| Breakpoint | Lebar | Perilaku Utama |
|---|---|---|
| Mobile | < 640px | Bottom navigation, single column, floating action button untuk aksi utama, peta dan list jadi tab terpisah |
| Tablet | 640-1024px | Sidebar bisa collapsed jadi icon-only, grid 2 kolom untuk card |
| Desktop | > 1024px | Sidebar penuh, split view peta/list, grid 3 kolom untuk landing page fitur |

Mobile adalah prioritas utama untuk alur Donor dan Volunteer, karena field kerja terjadi di lapangan lewat HP. Desktop diprioritaskan untuk role Pemantau/Admin yang lebih banyak melihat dashboard dan data agregat.

---

## 10. Tech Stack

Mengikuti stack yang sudah ditetapkan di proposal, supaya konsisten dengan dokumen kompetisi:

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Animasi | GSAP dengan ScrollTrigger |
| Ikon | Lucide Icons |
| Backend/API | Node.js / Express.js |
| Database dan Auth | Supabase |
| Peta | Leaflet.js dengan OpenStreetMap |
| QR | QR Code Generator library |
| Offline draft | LocalStorage |

Tambahan yang disarankan khusus untuk implementasi website:

- **Font loading**: gunakan `next/font` untuk Instrument Serif dan Inter, supaya tidak ada flash of unstyled text.
- **State management ringan**: cukup React Context atau Zustand untuk state role dan filter, tidak perlu Redux untuk scope MVP.
- **Form handling**: React Hook Form dengan validasi Zod, terutama untuk form Tambah Surplus yang punya banyak field.

---

## 11. Rencana Implementasi Bertahap

### Phase 0, Setup dan Design Foundation (target 2-3 hari)
- Setup project Next.js + Tailwind, konfigurasi design token (warna, tipografi, spacing) sesuai bagian 3.
- Setup Supabase project, skema database dasar (users, surplus_batch, distribution_log).
- Setup komponen dasar design system (button, input, card, badge) sebagai reusable component.
- Deliverable: Storybook sederhana atau halaman `/design-system` internal untuk cek konsistensi komponen.

### Phase 1, Landing Page dan Autentikasi (target 3-4 hari)
- Bangun seluruh section landing page sesuai bagian 5, termasuk animasi GSAP.
- Bangun halaman Login dan Register multi-role.
- Setup auth flow dengan Supabase Auth, termasuk role assignment saat register.
- Deliverable: landing page hidup, user bisa daftar dan login, redirect ke dashboard kosong sesuai role.

### Phase 2, Alur Donor Inti (target 4-5 hari)
- Donor Dashboard dengan ringkasan dan list batch.
- Form Tambah Surplus Pangan lengkap dengan upload foto, GPS, dan kalkulasi Freshness and Risk Score.
- Halaman Detail Batch (versi donor).
- Deliverable: donor bisa posting surplus dari nol sampai muncul dengan status kelayakan yang benar.

### Phase 3, Alur Volunteer dan Matching (target 4-5 hari)
- Halaman Surplus Terdekat dengan peta Leaflet dan list, termasuk filter dan sorting.
- Logika smart matching dasar (jarak, urgensi, kapasitas, kategori).
- Aksi klaim dan perubahan status distribusi (tersedia, diklaim, diambil, selesai).
- Halaman Rute Pickup.
- Deliverable: relawan bisa menemukan surplus terdekat, klaim, dan menyelesaikan alur pickup end-to-end.

### Phase 4, QR Traceability dan Impact Dashboard (target 3-4 hari)
- Generate QR per batch, halaman publik `/scan/:qrcode`.
- Impact Dashboard dengan metrik utama dan visualisasi tren.
- Halaman Riwayat untuk semua role.
- Deliverable: satu batch bisa dilacak penuh dari posting sampai selesai lewat QR, dan dashboard dampak menampilkan angka yang benar dari data real.

### Phase 5, Polish, Responsif, dan Aksesibilitas (target 3 hari)
- QA responsif penuh di breakpoint mobile, tablet, desktop.
- Audit kontras warna, terutama badge status dan teks di atas warna brand.
- Perhalus animasi GSAP, cek performa scroll di device low-end.
- Empty state, loading state, dan error state untuk semua halaman utama.
- Deliverable: aplikasi terasa rapi dan konsisten di semua device, siap untuk demo.

### Phase 6, Demo Preparation (target 1-2 hari)
- Seed data demo yang realistis (beberapa donor, beberapa batch dengan status berbeda, riwayat distribusi yang cukup untuk mengisi impact dashboard).
- Skenario demo end-to-end yang sudah dilatih, sesuai indikator keberhasilan MVP di proposal (bagian 4.10).
- Deliverable: aplikasi siap dipresentasikan tanpa data kosong atau state aneh saat live demo.

---

## 12. Kriteria Sukses per Fase

Sejalan dengan Indikator Keberhasilan MVP di proposal:

- Donor dapat menambahkan satu batch surplus pangan sampai statusnya tampil di peta.
- Sistem berhasil memberi status kelayakan awal: hijau, kuning, atau merah, dengan alasan yang ditampilkan.
- Volunteer/receiver dapat melakukan klaim dan mengubah status distribusi sampai selesai.
- QR batch dapat dipindai dan menampilkan riwayat singkat distribusi tanpa perlu login.
- Dashboard menampilkan total kilogram pangan terselamatkan, estimasi porsi, dan rata-rata waktu rescue secara akurat dari data yang ada.
- Landing page dan alur demo bisa menjelaskan nilai sosial, teknis, dan dampak dalam waktu presentasi yang singkat.

---

## 13. Catatan Non-Fungsional

- **Performa**: landing page ditarget Lighthouse Performance di atas 85 pada koneksi 4G, mengingat animasi GSAP dan gambar perlu dioptimasi (lazy load, image compression).
- **Aksesibilitas dasar**: kontras warna status minimal memenuhi WCAG AA, semua elemen interaktif bisa diakses keyboard, alt text untuk semua gambar penting.
- **Keamanan dasar**: validasi input di server (bukan hanya client), rate limiting sederhana untuk endpoint submit surplus supaya tidak disalahgunakan.
- **Data minim**: sesuai batasan di proposal, jangan menyimpan data penerima yang lebih detail dari yang dibutuhkan untuk matching dan pelacakan dasar.
