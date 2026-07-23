# Implementation Plan: Redesign Landing Page SisaPangan Solo
Referensi visual: GreenField Agriculture Landing Page (Dribbble)
Base design system: tetap pakai palette SisaPangan Solo (Deep Forest Green, Warm Amber, Rust Terracotta) + Space Grotesk & IBM Plex Sans

---

## 1. Tujuan

Redesign struktur & layout landing page SisaPangan Solo mengikuti pola referensi (grid asimetris, stat cards, numbered list, FAQ accordion, CTA banner), tanpa mengganti identitas visual (warna & tipografi) yang sudah ada.

---

## 2. Design System (tetap)

| Elemen | Value |
|---|---|
| Primary color | Deep Forest Green |
| Secondary color | Warm Amber |
| Accent color | Rust Terracotta |
| Heading font | Space Grotesk |
| Body font | IBM Plex Sans |
| Stack | Vanilla HTML/CSS/JS + localStorage |

---

## 3. Struktur Section (urutan)

1. **Navbar**
   - Logo kiri
   - Menu tengah: Home, Tentang, Marketplace, Blog, Kontak
   - CTA button kanan (solid, Deep Forest Green)

2. **Hero**
   - Headline 2 baris, 1 kata di-highlight dengan gambar inline bulat (icon makanan/koordinasi)
   - Subheading singkat (misi food rescue di Solo)
   - Tanpa CTA button di hero (mengikuti referensi, minimal)

3. **Image Grid 3 Kolom (asimetris)**
   - Card kiri: image + overlay text "Selamatkan Pangan, Bantu Sesama" + Learn More
   - Card tengah: 2 image stack + text box "Koordinasi Real-time & Terverifikasi"
   - Card kanan: image + text box "Dampak Terukur, Transparan" + Learn More

4. **About Section**
   - Label kecil + judul 2 baris (kiri), paragraf deskripsi (kanan)
   - Full-width image di bawah
   - 4 Stat Cards (1 solid highlight + 3 soft tint):
     - Total makanan terselamatkan (kg/porsi)
     - Jumlah Donor & Non-Consumption Partner aktif
     - Jumlah Volunteer terdaftar
     - Estimasi karbon yang berhasil dicegah (carbon calculator)

5. **How It Works ("Why Choose Us" style)**
   - 2 image kiri-kanan dengan 2 floating badge di tengah (angka + label)
   - Split bawah: card CTA kiri ("Gabung Jadi Volunteer") + numbered list kanan (3 poin, alur 5 role):
     1. Donor melaporkan surplus pangan
     2. Volunteer menjemput dengan rute teroptimasi (route optimization)
     3. Disalurkan ke Non-Consumption Partner, dipantau Monitor & Admin

6. **Peran & Kontribusi (Product Detail style, ganti "kategori produk")**
   - Background tint beda (Warm Amber tint)
   - Image kiri + list 4 peran kanan (icon + judul + deskripsi):
     - Donor — restoran/toko yang melaporkan surplus makanan
     - Volunteer — penjemput & pengantar makanan
     - Non-Consumption Partner — panti/komunitas penerima
     - Monitor & Admin — verifikasi, laporan, gamifikasi & badge
   - Button "Lihat Semua Peran"

7. **FAQ Accordion**
   - Single column, expand/collapse
   - Default satu item terbuka
   - Pertanyaan seputar: cara jadi Donor/Volunteer, standar keamanan pangan, area jangkauan Solo, sistem badge/gamifikasi

8. **CTA Banner**
   - Full-width rounded, background tint hijau muda
   - Icon dekoratif tengah
   - Judul + deskripsi + button ("Gabung Sekarang")

9. **Footer**
   - Logo + deskripsi singkat (kiri)
   - 3 kolom link: Quick Links, Company Profile, Contact
   - Social icons
   - Bottom bar: copyright + terms/privacy

---

## 4. Komponen Reusable yang Perlu Dibuat

| Komponen | Deskripsi |
|---|---|
| `.hero-inline-badge` | Gambar bulat inline di tengah headline |
| `.image-grid-3col` | Grid asimetris 3 kartu (hero section) |
| `.stat-card` | 4 varian: 1 solid, 3 tint |
| `.floating-badge` | Badge angka mengambang di atas 2 gambar |
| `.numbered-list-item` | List dengan angka bulat + deskripsi |
| `.role-item` | Icon + judul + deskripsi (Donor, Volunteer, Non-Consumption Partner, Monitor/Admin) |
| `.faq-accordion` | Accordion vanilla JS (expand/collapse) |
| `.cta-banner` | Section rounded full-width dengan SVG dekoratif |

---

## 5. Mapping Konten Referensi → SisaPangan Solo

| Referensi (GreenField) | SisaPangan Solo |
|---|---|
| Natural Farming | Marketplace Terverifikasi |
| Quality Products | Dampak Lingkungan Terukur |
| Cultivating Growth Through Modern Agriculture | Ubah Sisa Pangan Jadi Nilai |
| Stats: 95%, 100+, 400+, 100% | Kg sisa pangan terselamatkan, mitra pengepul, total transaksi, % refurbish |
| Comprehensive Agricultural Offerings | Bagaimana SisaPangan Solo Bekerja |
| Seeds & Seedings / Fertilizers / Crop Protection | Drop-off / Verifikasi / Redistribusi |
| Top Agriculture Enterprises | Kategori Sisa Pangan |
| Organic Corn, Tomato, Fruits, Orange (list kategori) | Elektronik RT, Gadget, Komponen, Baterai |
| FAQ pertanian | FAQ jual/donasi sisa pangan |

---

## 6. Urutan Pengerjaan

1. Setup ulang CSS variables — pastikan token warna & font sesuai palette SisaPangan Solo
2. Navbar + Hero + Image Grid 3 kolom
3. About Section + Stat Cards
4. How It Works (floating badge + numbered list)
5. Kategori Sisa Pangan section
6. FAQ Accordion (vanilla JS)
7. CTA Banner + Footer
8. Responsive pass — semua grid/kolom stack jadi 1 kolom di mobile

---

## 7. Catatan Teknis

- Gunakan `localStorage` untuk data dummy yang perlu persist (misal state FAQ terakhir dibuka, counter stats jika ada animasi count-up)
- Semua image grid & card harus reflow ke 1 kolom di breakpoint mobile (<768px)
- Hindari elemen dekoratif berlebihan yang bikin kesan "AI slop" — tetap minimal & solid sesuai preferensi desain sebelumnya