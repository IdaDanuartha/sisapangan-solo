# Gap Analysis: Constraint Hackathon vs SisaPangan Solo

## Ringkasan

Analisis terhadap 2 constraint dari Hackathon Bytesfest 2026 dibandingkan dengan implementasi
saat ini di project SisaPangan Solo.

---

## Constraint 1 — Multi-Role Collaboration & Activity Monitoring

> Setiap tim wajib mengimplementasikan sistem manajemen pengguna berbasis peran (role-based access control)
> yang mencakup minimal **tiga jenis pengguna** dengan hak akses yang berbeda, disesuaikan dengan konteks
> solusi masing-masing. Setiap peran harus memiliki **dashboard tersendiri** yang menampilkan informasi,
> menu, dan ringkasan data sesuai tanggung jawabnya. Dashboard tidak boleh identik antar peran.
> **Pembatasan hak akses wajib diterapkan secara nyata** dan dapat dibuktikan saat demonstrasi. Selain itu,
> sistem harus mencatat **aktivitas-aktivitas terakhir yang dilakukan pengguna**. Administrator wajib
> memiliki halaman monitoring yang menampilkan data seperti **jumlah pengguna aktif, jumlah aktivitas hari
> ini, aktivitas terbaru, dan distribusi aktivitas berdasarkan peran**. Fitur ini harus terintegrasi dengan
> sistem utama dan tidak boleh berupa tampilan statis.

### ✅ Sudah Terimplementasi

| Fitur | Detail |
|-------|--------|
| **5 role pengguna** | `donor`, `volunteer`, `non-consumption`, `monitor`, `admin` — defined di schema RLS |
| **Dashboard per-role** | `DonorDashboard`, `VolunteerDashboard`, `AdminDashboard` (terpisah) |
| **Route protection** | Middleware redirect `/app/*` jika belum login |
| **RBAC di database** | Row Level Security (RLS) Supabase per tabel, per role |
| **Verifikasi admin** | Volunteer/non-consumption butuh `is_verified = true` sebelum akses peta |
| **User management** | `/app/users` — admin bisa edit role, verify/suspend pengguna |
| **Role-based navigation** | AppShell menyembunyikan/menampilkan menu sesuai role |
| **Monitoring dashboard** | Role `monitor` diarahkan ke AdminDashboard (view-only) |

### ❌ Belum Terimplementasi / Kurang

| Gap | Keparahan | Keterangan |
|-----|-----------|------------|
| **Activity Log (pencatatan aktivitas user)** | 🔴 **Kritis** | Tidak ada tabel `user_activity_log`. Tidak ada pencatatan saat user login, klaim batch, update profil, dll. |
| **Jumlah pengguna aktif hari ini** | 🔴 **Kritis** | Admin dashboard tidak menampilkan pengguna yang aktif **hari ini** — hanya total keseluruhan. |
| **Jumlah aktivitas hari ini** | 🔴 **Kritis** | Tidak ada metrik "total aktivitas hari ini" di admin dashboard. |
| **Distribusi aktivitas berdasarkan peran** | 🟡 **Medium** | Ada distribusi kategori surplus, tapi tidak ada distribusi _aktivitas_ berdasarkan role. |
| **Aktivitas terbaru (real-time feed)** | 🟡 **Medium** | Ada "Distribusi Terbaru" berdasarkan batch, tapi bukan log aktivitas platform (login, klaim, update, dll). |
| **Route-level access control per role** | 🟡 **Medium** | Middleware hanya cek autentikasi. Tidak ada proteksi: misal donor tidak bisa akses `/app/users`. |

---

## Constraint 2 — Smart Impact Dashboard & Action Log

> Setiap tim wajib menambahkan fitur dashboard terintegrasi yang mampu menampilkan **kondisi utama,
> dampak, dan rekomendasi tindak lanjut** dari solusi yang dikembangkan. Dashboard harus memuat minimal
> **empat metrik utama** yang relevan dengan konteks solusi. Tersedia **minimal dua filter data** yang
> benar-benar memengaruhi tampilan, seperti periode waktu, status, kategori, wilayah, atau prioritas.
> Sistem juga wajib menyediakan **tabel atau daftar detail** yang memuat nama item, kategori, status,
> prioritas, waktu, dan tombol aksi.

### ✅ Sudah Terimplementasi

| Fitur | Detail |
|-------|--------|
| **4+ metrik utama** | 6 kartu metrik di Admin: kg selamat, porsi, donor, penerima, rescue time, non-konsumsi |
| **Grafik tren & kategori** | Line chart + donut chart di AdminDashboard |
| **Filter periode** | Time filter: Minggu Ini / Bulan Ini / Tahun Ini / 5 Tahun (di semua dashboard) |
| **AI Impact Summary** | Banner "Ringkasan 7 Hari Terakhir" di AdminDashboard |
| **Tabel surplus** | SurplusManagement punya tabel dengan nama, kategori, status, tombol aksi |
| **Filter status & kategori** | Di `/app/surplus` (SurplusManagementClient) ada filter status & kategori |
| **CO₂ estimate** | ImpactDashboardClient menampilkan estimasi CO₂ dihindari |

### ❌ Belum Terimplementasi / Kurang

| Gap | Keparahan | Keterangan |
|-----|-----------|------------|
| **Rekomendasi tindak lanjut (actionable)** | 🔴 **Kritis** | AI Impact Summary ada tapi statis/hardcoded. Tidak ada rekomendasi dinamis berdasarkan data real. |
| **Filter wilayah di dashboard** | 🟡 **Medium** | Tidak ada filter berdasarkan **wilayah/area** di dashboard utama admin. |
| **Filter prioritas** | 🟡 **Medium** | Tidak ada filter "prioritas" (urgent/safe/non-consumption) di dashboard impact. |
| **Tabel detail di dashboard impact** | 🟡 **Medium** | ImpactDashboardClient tidak punya tabel detail — hanya chart & metrik. Tabel ada di halaman surplus terpisah. |
| **Kolom prioritas di tabel** | 🟠 **Minor** | Tabel surplus ada, tapi tidak ada kolom eksplisit "prioritas" (freshness_status belum ditampilkan sebagai badge prioritas di tabel admin). |
| **Dashboard impact sebagai halaman mandiri** | 🟠 **Minor** | `/app/impact` hanya redirect ke `/app/dashboard`. Tidak ada halaman impact tersendiri yang komprehensif. |

---

## Proposed Changes

> [!IMPORTANT]
> Prioritas utama adalah **Constraint 1 (Activity Log + Monitoring)** karena constraint tersebut mensyaratkan fitur yang benar-benar belum ada sama sekali (tabel DB + UI).

---

### Component 1 — Database: Tabel `user_activity_log`

#### [MODIFY] [schema.sql](file:///home/hatsu/Project/sisapangan-solo/supabase/schema.sql)

Tambah tabel baru untuk mencatat aktivitas pengguna:

```sql
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  action TEXT NOT NULL,         -- 'login', 'claim_batch', 'complete_batch', 'add_surplus', dll
  resource_type TEXT,           -- 'surplus_batch', 'profile', dll
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Component 2 — API: Log Activity Endpoint

#### [NEW] `src/app/api/activity/log/route.ts`

POST endpoint untuk mencatat aktivitas dari client-side events (klaim batch, tambah surplus, dll).

---

### Component 3 — Admin Dashboard: Activity Monitoring Section

#### [MODIFY] [AdminDashboard.tsx](file:///home/hatsu/Project/sisapangan-solo/src/components/app/AdminDashboard.tsx)

Tambah section baru di bawah metric cards yang berisi:
- **Pengguna Aktif Hari Ini** — count distinct `user_id` dari `user_activity_log` dimana `created_at >= today`
- **Aktivitas Hari Ini** — total rows `user_activity_log` hari ini
- **Feed Aktivitas Terbaru** — list 10 aktivitas terakhir dari semua user (siapa, apa, kapan)
- **Distribusi Aktivitas per Role** — bar chart/donut berdasarkan `role` dari log hari ini

---

### Component 4 — Middleware: Route-Level RBAC

#### [MODIFY] [middleware.ts](file:///home/hatsu/Project/sisapangan-solo/src/middleware.ts)

Tambah proteksi per-route:
- `/app/users` → hanya `admin`
- `/app/surplus/add` → hanya `donor`
- `/app/surplus/nearby` → hanya `volunteer`, `non-consumption`

---

### Component 5 — Smart Impact Dashboard: Filter Wilayah + Tabel Detail

#### [MODIFY] [ImpactDashboardClient.tsx](file:///home/hatsu/Project/sisapangan-solo/src/components/app/ImpactDashboardClient.tsx)

- Tambah filter **wilayah** (lokasi/area) dan **prioritas** (freshness_status)
- Tambah tabel detail di bawah metrik dengan kolom: Nama Item, Kategori, Status, Prioritas, Waktu, Tombol Aksi

---

### Component 6 — Rekomendasi Tindak Lanjut (Dynamic)

#### [MODIFY] [AdminDashboard.tsx](file:///home/hatsu/Project/sisapangan-solo/src/components/app/AdminDashboard.tsx)

Ganti AI Impact Summary dari hardcoded menjadi **dinamis** berdasarkan data real:
- Jika banyak batch urgent → rekomendasikan "Percepat koordinasi relawan"
- Jika non-consumption meningkat → rekomendasikan "Tambah mitra maggot/kompos"
- Kalkulasi dari data `batches` yang sudah di-fetch

---

## Open Questions

> [!IMPORTANT]
> Apakah boleh menggunakan `distribution_log` yang sudah ada sebagai proxy untuk "aktivitas terbaru", ataukah memang perlu membuat tabel `user_activity_log` baru yang lebih komprehensif?

> [!NOTE]
> Untuk demonstrasi, apakah route-level RBAC sudah cukup dengan middleware redirect, atau perlu juga API-level guard (sudah ada sebagian via RLS)?

---

## Verification Plan

### Automated
- Build check: `pnpm build` — pastikan tidak ada TypeScript error

### Manual Verification
- [ ] Login sebagai **donor** → tidak bisa akses `/app/users` (redirect)
- [ ] Login sebagai **admin** → dashboard menampilkan jumlah pengguna aktif hari ini & feed aktivitas real
- [ ] Klaim batch sebagai volunteer → muncul di activity feed admin
- [ ] Filter wilayah di ImpactDashboard benar-benar mengubah tampilan tabel
- [ ] Rekomendasi berubah sesuai kondisi data (tidak selalu sama)