# Product Requirements Document
## SisaPangan Solo — Food Rescue Coordination System for Greater Solo (Solo Raya)

Version 1.0, prepared based on the BYTESFEST 2026 Proposal, TIM REGEX

> **Note on language:** This PRD is written in English, and all route/endpoint names use English slugs for developer clarity. However, all on-screen UI copy (labels, buttons, menu items, headings, status text) stays in **Bahasa Indonesia**, since the live product targets Indonesian users in Solo Raya. Wherever exact UI copy is referenced below, the Indonesian string is shown in quotes, with an English gloss in parentheses on first use.

---

## 1. Product Overview

SisaPangan Solo is a food rescue coordination platform that connects food donors (culinary MSMEs, restaurants, caterers, markets), volunteers, beneficiaries, non-consumption food managers, and regional monitors within a single digital workflow. This is not an ordinary donation app. Its core focus is time-based food safety triage, matching with the nearest relevant party, and measuring impact that can be proven with data.

For the website version, the product consists of two major parts:

1. **Marketing site / landing page** — where prospective donors, volunteers, and partners understand the product's value and sign up.
2. **Multi-role web app** (donor, volunteer/receiver, non-consumption manager, monitor/admin) — where the core food rescue flow runs.

### 1.1 Product Goals

- Cut the time between when a food surplus is found and when it is picked up.
- Provide automatic prioritization via the Freshness and Risk Score, so that time-sensitive, high-risk food doesn't get handled too late.
- Provide trackable proof of distribution via QR code, so donors and recipients both feel secure.
- Present an impact dashboard that can be used directly for reporting to local government or partners.

### 1.2 What's Out of Scope for the MVP

Written here so scope doesn't creep during implementation.

- No payment gateway or monetary transactions.
- Not an official aid-distribution institution.
- Does not store deep, sensitive recipient data — only the operational data needed for matching and tracking.
- The Freshness and Risk Score is a prioritization aid, not a replacement for manual field inspection.

---

## 2. Target Users

| Role | Who | Main Website Needs |
|---|---|---|
| Donor | Culinary MSMEs, restaurants, hotels, caterers, canteens, markets, event organizers | Quick form to post surplus, real-time pickup status, distribution history |
| Volunteer / Receiver | Food-sharing volunteers, social communities, orphanages, community kitchens, posyandu (community health posts) | Prioritized pickup list, route to donor location, one-tap claim |
| Non-consumption manager | Livestock farmers, maggot/BSF cultivators, organic waste banks | Access to batches flagged as unfit for human consumption |
| Monitor / Local government / Partners | Relevant government agencies, partner organizations such as Gita Pertiwi | Aggregate dashboard, surplus patterns, volume rescued |
| Internal admin | TIM REGEX / platform operators | Data moderation, account verification, system monitoring |

For the MVP, the three roles that must have a complete flow on the website are **Donor**, **Volunteer/Receiver**, and **Monitor (impact dashboard)**. The non-consumption manager can reuse the Volunteer interface, distinguished by a category filter.

---

## 3. Design Philosophy

### 3.1 Core Principles

**Clarity before beauty.** This is a field tool, used by people in a hurry the moment a food surplus is found. Every visual decision should speed up status recognition, not decorate it.

**Urgency has its own visual language.** The green/yellow/red status system is part of the product's function, not decoration. This status color scheme stays consistent everywhere, from a small badge on a card to the map.

**Warm, not corporate.** This product speaks to culinary MSMEs and community volunteers, not enterprise SaaS buyers. The design should draw warmth from local Solo food and community culture, while staying modern and clean — not traditional or cluttered.

**One system, many roles.** Donor, volunteer, and monitor share the same interface shell, differing only in dashboard content. This keeps things consistent and speeds up development.

**Not generic.** Avoid overused SaaS template layouts, like purple-blue gradient heroes with generic 3D illustrations. Use color and typography combinations with real character, photos/illustrations that feel local and human, and interaction details that feel intentional rather than bolted on.

### 3.2 Color Palette

The palette is built from two ideas: the warmth of food, and trust in the system. The base colors feel organic and approachable, while status colors use a universal semaphore system that can be read at a glance.

**Primary Colors**

| Name | Hex | Usage |
|---|---|---|
| Harvest Green | `#2F6E4F` | Main brand color, navigation, primary CTA, active elements |
| Harvest Green Dark | `#1E4A35` | Hover state, text on light backgrounds, footer |
| Harvest Green Light | `#E4F0E8` | Section backgrounds, success badges, soft highlights |

**Secondary / Accent Colors**

| Name | Hex | Usage |
|---|---|---|
| Warm Amber | `#E88C2D` | Warm accent, food icons, secondary interactive elements, illustration |
| Amber Soft | `#FBEBD8` | Card backgrounds, alternate sections |
| Clay Terracotta | `#C1502E` | Optional decorative accent, used sparingly for variation, not for status |

**Neutral Colors**

| Name | Hex | Usage |
|---|---|---|
| Ink | `#1B1F1C` | Primary text |
| Slate | `#5B655D` | Secondary text, captions |
| Mist | `#9AA39C` | Placeholder, borders, disabled text |
| Fog | `#F4F6F3` | App-wide background |
| Paper | `#FFFFFF` | Cards, modals, elevated surfaces |

**Food Safety Status Colors** (used consistently as part of function, not branding)

| Status | Name | Hex | Meaning |
|---|---|---|---|
| Safe | Fresh Green | `#3AA65A` | Fit to distribute to people |
| Urgent | Urgent Amber | `#F0A93B` | Needs to be picked up soon |
| Non-consumption | Alert Red | `#D14343` | Redirected to feed, maggot cultivation, or compost |

Important note: these status colors are deliberately different in saturation and tone from the brand colors (Harvest Green vs. Fresh Green), so status badges are never confused with navigation or branding elements when scanned quickly.

**Dark mode** is not required for the MVP. If tackled in a later phase, use Ink as the background and raise status color lightness by about 10% to maintain contrast.

### 3.3 Typography

| Role | Font | Rationale |
|---|---|---|
| Display / Headline (landing page, large titles) | **Instrument Serif** | Editorial, warm, human character — good for storytelling on the landing page without feeling like a generic startup template |
| UI / Body / Dashboard | **Inter** | Neutral, highly legible at small sizes, industry standard for dashboards and data-dense screens |
| Large numbers / metrics (impact dashboard) | **Inter Tight** or **Inter** with `font-variant-numeric: tabular-nums` | Numbers align neatly when they change — important for a real-time dashboard |

Recommended type scale ratio is 1.25 (major third) from a 16px base, with landing page headlines scaling up to 56–72px on desktop.

Avoid using the display font for small UI labels like status badges or buttons — serif at small sizes hurts legibility on mobile screens.

### 3.4 Icons and Illustration

- All functional icons use **Lucide Icons**, consistent 1.5–2px stroke width, unfilled except for active states.
- No emoji in the UI or copywriting.
- Custom illustrations (if used — e.g. empty states or the landing page) use a simple line-art style with accent colors from the palette above, not generic 3D illustration or the "corporate memphis" style that's already overused in 2024–2025 SaaS products.
- Photos (if used on the landing page) should be real photos of food rescue activity or local culinary MSMEs, not generic stock photos of "smiling people with laptops."

### 3.5 Spacing, Radius, and Shadow

- Base spacing unit is 4px, common scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 8px for small elements (inputs, badges), 12–16px for cards, 24px for large modals. Stay consistent — don't mix sharp and very rounded radii on one screen.
- Shadows should be used sparingly, only for functional elevation (dropdowns, modals, floating action buttons). Use soft, low-opacity shadows, not the old, harsh Material-style shadows.

---

## 4. Information Architecture

### 4.1 Sitemap

```
/
  Landing Page (public)
    - Hero
    - Problem (food loss and waste data)
    - How It Works
    - Key Features
    - Impact / Social Proof
    - Sign-up CTA

/login
/register
  - Register as Donor
  - Register as Volunteer/Receiver
  - Register as Non-consumption Manager

/app  (requires login, role-based)
  /app/dashboard              -> content differs per role
  /app/surplus/add            -> Donor
  /app/surplus/recurring      -> Donor, manage Recurring Surplus templates
  /app/surplus/nearby         -> Volunteer/Receiver, map + list
  /app/surplus/:id            -> Batch detail, status, QR, post-pickup rating
  /app/pickup/route           -> Volunteer, route to location
  /app/history                -> All roles, their own transaction history
  /app/impact                 -> Impact dashboard (Monitor + limited public aggregate)
  /app/badges                 -> Donor, streak and contribution badges
  /app/profile                -> includes notification channel preference (in-app / WhatsApp)
  /app/notifications

/scan/:qrcode                 -> Public QR traceability result page
```

### 4.2 Role-based Navigation

The app shell is the same for all roles (sidebar on desktop, bottom navigation on mobile), but menu items adapt per role. Menu labels below are shown as they actually appear on screen (in Indonesian), with an English gloss:

- **Donor**: "Dashboard", "Tambah Surplus" (Add Surplus), "Surplus Rutin" (Recurring Surplus), "Riwayat" (History), "Badge Saya" (My Badges), "Profil" (Profile)
- **Volunteer/Receiver**: "Dashboard", "Surplus Terdekat" (Nearby Surplus), "Rute Pickup" (Pickup Route), "Riwayat" (History), "Profil" (Profile)
- **Non-consumption manager**: same as Volunteer, with the non-consumption category filter applied by default
- **Monitor/Admin**: "Dashboard Dampak" (Impact Dashboard), "Data Surplus" (read-only map), "Manajemen Akun" (Account Management, admin-only), "Profil" (Profile)

---

## 5. Landing Page — Detailed Spec

The landing page is the main acquisition channel for new donors and volunteers, and also serves as a presentation tool during the hackathon demo.

### 5.1 Section Structure

1. **Navbar**
   Logo, anchor links ("Cara Kerja", "Fitur", "Dampak" — How It Works, Features, Impact), "Masuk" (Log In) and "Daftar" (Sign Up) buttons. Sticky, transitions from transparent to solid background as the user scrolls past the hero.

2. **Hero**
   Large headline in Instrument Serif, one sub-headline sentence explaining the product in plain language, two CTAs ("Daftar sebagai Donor" / "Daftar sebagai Relawan" — Sign Up as a Donor / Sign Up as a Volunteer), and a supporting visual such as a dashboard mockup or an illustration of the surplus-to-recipient flow.
   GSAP animation: headline and CTA elements fade up in sequence on page load (not on scroll), with a light 80–100ms stagger between elements.

3. **Problem**
   Displays 2–3 key statistics from the proposal (23–48 million tons/year, Rp213–551 trillion in losses, 1.05 billion tons of global food waste) as large numbers with a count-up animation as the section enters the viewport.
   GSAP animation: `ScrollTrigger` triggers the count-up and fade-in of stat cards once 40% of the section is visible.

4. **How It Works**
   Horizontal (desktop) or vertical (mobile) timeline showing 4 steps: donor posts surplus, system assigns a safety score, matching to the nearest recipient, distribution logged via QR.
   GSAP animation: each step appears in sequence with a connecting line that "draws itself" (stroke-dashoffset animation) following scroll progress.

5. **Key Features**
   3-column grid (desktop) with 5–6 core features (Freshness Score, Smart Matching, QR Traceability, Impact Dashboard, Volunteer Routing), each card with a Lucide icon, a title, and a short description.
   GSAP animation: cards fade up with a stagger on scroll-in; hover state lifts the card slightly (translateY -4px + shadow).

6. **Impact / Local Proof**
   Highlights local Solo Raya context, and can include a short reference to supporting data from the proposal about the existing food-sharing ecosystem in Surakarta, framed as collaboration rather than competition.

7. **Final CTA**
   Sign-up prompt with two clear paths (Donor / Volunteer), background using Harvest Green Dark for contrast against the previous section.

8. **Footer**
   Important links, team contact, and TIM REGEX attribution.

### 5.2 Scroll Animation Principles (GSAP)

- Use `ScrollTrigger` with `once: false` only for decorative elements, and `once: true` for content elements so repeated scrolling up/down doesn't feel disruptive.
- Animation duration 400–700ms, `power2.out` easing for entrances, `power1.inOut` for elements that move directly with scroll progress.
- Avoid scroll-jacking or animations that make text unreadable before the animation finishes. All important text must be readable from the first frame — animation should only smooth its appearance.
- Respect `prefers-reduced-motion`, and disable non-essential animation if the user has that setting enabled on their device.

---

## 6. Authentication

### 6.1 Login

A simple form: email/phone and password, a "lupa password" (forgot password) option, and a link to the register page. After login, redirect to `/app/dashboard` based on role.

### 6.2 Register

Registration starts with a role selection (Donor / Volunteer-Receiver / Non-consumption Manager), since required fields differ per role:

- **Donor**: business/individual name, type ("UMKM", "Restoran", "Katering", "Pasar", "Individu", "Lainnya" — MSME, Restaurant, Caterer, Market, Individual, Other), location/address, contact number.
- **Volunteer/Receiver**: name, type ("Relawan Individu", "Komunitas", "Panti", "Dapur Umum", "Posyandu" — Individual Volunteer, Community, Orphanage, Community Kitchen, Posyandu), operating location, estimated capacity.
- **Non-consumption manager**: name, management type ("Maggot", "Ternak", "Kompos", "Bank Sampah Organik" — Maggot Cultivation, Livestock, Compost, Organic Waste Bank), location.

Fields are kept minimal for the MVP — just enough for matching and basic verification, no heavy KYC. An account can carry an "unverified" status and still be usable with limited access, while an admin verifies it manually in the background.

The contact number collected at registration doubles as the WhatsApp number for notifications (section 7.9). A checkbox during registration, checked by default, asks whether the user consents to receive WhatsApp alerts on that number — this can be changed later on the profile page.

---

## 7. Core Feature Specifications

### 7.1 Donor Dashboard

**Purpose**: donors can see the status of surplus they've already posted and quickly add new surplus.

**Contents**:
- Quick summary at the top: number of active batches, total kg rescued all-time, number of pending pickups.
- Primary "Tambah Surplus Pangan" (Add Food Surplus) button, always visible (floating action button on mobile).
- List/grid of recent surplus batch cards, each showing photo, food name, freshness status badge, distribution status ("Tersedia", "Diklaim", "Diambil", "Selesai" — Available, Claimed, Picked Up, Completed), and time remaining before the food is no longer fit for consumption.

### 7.2 Add Food Surplus

**Purpose**: a quick form, ideally fillable in under 90 seconds in the field.

**Fields**:
- Food photo (required, multiple photos allowed)
- Food name/type
- Category ("Makanan Matang", "Roti/Bakery", "Buah Potong", "Sayuran", "Bahan Segar", "Lainnya" — Cooked Food, Bread/Bakery, Cut Fruit, Vegetables, Fresh Ingredients, Other)
- Quantity (with unit: "porsi", "kg", "box" — servings, kg, box)
- Location (auto-detected GPS, with an option to manually adjust the map pin)
- Estimated time still fit for consumption (date-time picker, or quick options: 2 hours, 6 hours, 24 hours)
- Additional condition notes (optional free text)

**Behavior**:
- After submitting, the system immediately calculates the Freshness and Risk Score and shows the result (green/yellow/red) before final confirmation, so the donor knows where their post is headed.
- A draft auto-saves to local storage if the connection drops mid-entry, matching the field conditions described in the proposal.

#### 7.2.1 Recurring Surplus Mode

**Purpose**: donors with a repeating surplus pattern (canteens, event caterers) skip re-entering the same fields every time, pushing the "under 90 seconds" target even lower for their day-to-day use.

**Behavior**:
- After a donor successfully submits a batch, the form offers a one-tap option: "Jadikan Surplus Rutin" (Make This a Recurring Surplus).
- Saving a recurring template stores the reusable fields (food name/type, category, quantity, unit, location, default estimated-fit-for-consumption window) against the donor's account. Photos and any per-instance condition notes are always re-entered fresh, since those change batch to batch.
- On a scheduled day/time, the donor gets a notification (in-app and/or WhatsApp, per 7.9) prompting them to confirm today's batch from the template. Confirming pre-fills the Add Food Surplus form; the donor only needs to add a photo, adjust quantity if it differs, and confirm — well under the 90-second target.
- Templates are managed from `/app/surplus/recurring`: create, edit schedule (day-of-week + time), pause, or delete.
- No new core table is required beyond a `surplus_template` table (donor_id, template fields, schedule) that the confirmation flow reads from and writes a normal `surplus_batch` row into — the rest of the pipeline (Freshness Score, matching, QR) is unchanged.

### 7.3 Freshness and Risk Score (display)

Not a heavy AI feature — a rule-based score displayed as a status-colored badge (see 3.2). Also show a short reason for the score (e.g. "Kategori makanan matang, sisa waktu 3 jam, status: segera diambil" — Cooked food category, 3 hours remaining, status: pick up soon), so donors and volunteers understand the logic rather than seeing a black box.

**Storage condition input**: the Add Food Surplus form (7.2) gets one optional field, "Disimpan di suhu ruang / kulkas" (Stored at room temperature / refrigerated), applicable mainly to the "Makanan Matang" (Cooked Food) and "Bahan Segar" (Fresh Ingredients) categories. This is a single additional variable in the existing rule-based formula, not a new scoring engine:

- Cooked or fresh food left at room temperature has its safe time-window shortened relative to the same category refrigerated, reflecting the faster spoilage risk.
- If the donor leaves the field blank, the system defaults to the current (room-temperature-equivalent) rule, so the feature is fully backward-compatible with existing scoring logic.
- The reason text shown to the donor/volunteer includes this factor when it changes the outcome, e.g. "Kategori makanan matang, disimpan di suhu ruang, sisa waktu 3 jam, status: segera diambil" (Cooked food category, stored at room temperature, 3 hours remaining, status: pick up soon).

### 7.4 Nearby Surplus (Volunteer/Receiver)

**Purpose**: volunteers/recipients see surplus around them and decide quickly which to claim.

**Layout**: split view on desktop (map on the right, list on the left), a tab-switch between map/list on mobile.

**Map**: markers colored by freshness status; clicking a marker opens a preview card. Built with Leaflet.js and OpenStreetMap, per the proposal's stack.

**List**: default-sorted by a combination of urgency and distance (not distance alone), with filters for food category, status, and distance radius.

**Action**: a "Klaim" (Claim) button available directly from the card or from the batch detail page, with a light confirmation step before status changes to "Diklaim" (Claimed).

### 7.5 Batch Detail and QR Traceability

The batch detail page shows the full history: donor origin, post time, freshness score, who claimed it, pickup time, final recipient, and final status. Each batch's QR code links to the public `/scan/:qrcode` page, which shows a summary of this history — scannable by anyone, no login required, for full transparency.

### 7.6 Pickup Route (Volunteer)

A list of pickups the volunteer has claimed, sorted by urgency, with a button to open the route on a map (can deep-link to Google Maps for turn-by-turn navigation, since building a custom routing engine is out of scope for the MVP).

### 7.7 Impact Dashboard

**Purpose**: metrics that can be used directly for reports to local government or hackathon judges.

**Key metrics** (large cards at the top):
- Total kg of food rescued
- Estimated number of meal portions
- Number of active surplus points
- Average rescue time (from posting to pickup)

**Supporting visualizations**:
- Trend chart of kg rescued per week/month
- Heatmap of surplus points (optional, later phase)
- Breakdown of the food categories that most often go to surplus

The Monitor role sees platform-wide aggregate data. Donor and Volunteer roles see their own personal contribution on the "Riwayat" (History) page, not the full Impact Dashboard.

### 7.8 History

A list of transactions/batches relevant to the user's role (donor: batches they posted; volunteer: batches they claimed/picked up), with status and date-range filters.

### 7.9 Notifications

Minimal in-app notifications for the MVP: new surplus matching a volunteer's favorite radius/category, batch status changes (for donors), and reminders as a batch approaches its consumption deadline. Browser push notifications are optional, for a later phase.

**WhatsApp fallback channel (Fonnte)**: since donors (culinary MSMEs) and volunteers in the field check WhatsApp far more often than an installed app, the same notification events also fire through the **Fonnte WhatsApp API** as a fallback channel alongside in-app notifications, not a replacement for them.

- Trigger events: new surplus matching a volunteer's saved radius/category ("Ada surplus baru di dekat kamu"), a batch approaching its consumption deadline ("Batch kamu akan kedaluwarsa dalam 1 jam"), batch status changes for the donor (claimed, picked up, completed), and the Recurring Surplus confirmation prompt (7.2.1).
- **Implementation**: the Express backend calls Fonnte's send-message REST endpoint (`POST https://api.fonnte.com/send`) with the device token in the request header, target phone number, and message body, triggered from the same event that already writes the in-app notification — no separate notification pipeline, just one more delivery target from the existing event.
- Messages are short, plain text, and include a direct link back into the relevant app screen (e.g. the batch detail page) where possible.
- Respects the WhatsApp opt-in collected at registration (6.2) and can be toggled off anytime from `/app/profile`.
- Failure handling: if the Fonnte API call fails or times out, it fails silently from the user's perspective — the in-app notification has already been written, so no pickup-critical information depends solely on WhatsApp delivery.
- Rate limiting: batched or throttled per user (e.g. max one WhatsApp message per event type per batch) to avoid spamming a donor or volunteer with duplicate alerts.

### 7.10 Donor Streak and Contribution Badges

**Purpose**: light gamification on the Donor side to encourage donors to keep posting surplus regularly, building on data that already exists rather than introducing new tracking.

**Contents**:
- Badges are computed from existing `distribution_log` (and `surplus_batch`) records via aggregation queries — no new core table is needed, only a small `donor_badge` (or view) that caches computed badge state so the dashboard doesn't recompute on every page load.
- Example badges: "Donor Aktif 5 Minggu Berturut-turut" (Active Donor, 5 Weeks in a Row) for consecutive weekly posting, and "Top Donor Bulan Ini" (Top Donor This Month) for the highest kg-rescued contribution in the current month.
- Shown as a small badge strip on the Donor Dashboard (7.1) summary area, with a dedicated `/app/badges` page listing all earned and in-progress badges plus streak progress.
- Badge state recalculates on a scheduled job (e.g. nightly) rather than in real time, since streaks and monthly rankings don't need to update instantly.
- Purely motivational — badges have no effect on matching priority, Freshness Score, or any other functional part of the system, keeping scope contained.

### 7.11 Post-Pickup Rating and Feedback

**Purpose**: a lightweight feedback loop after a batch reaches "Selesai" (Completed) status, used both to recalibrate the Freshness and Risk Score over time and as field-validation data (per proposal section 4.9).

**Behavior**:
- When a batch's status changes to "Selesai", the volunteer/receiver who completed the pickup sees one short prompt on the batch detail page (and optionally via the same in-app/WhatsApp notification channel): "Apakah kondisi makanan sesuai deskripsi?" (Did the food's condition match the description?), answered with a thumbs up/down or a 1–5 scale.
- The response is stored against the batch record (a `pickup_rating` field on the existing distribution/batch tables — no new table required) alongside the batch's category, storage condition (7.3), and elapsed time at pickup.
- Feedback is optional and single-tap, so it doesn't add friction to the completion flow.
- Aggregated ratings feed two places: (1) the Monitor's Impact Dashboard (7.7), as a simple "kesesuaian kondisi" (condition-match) quality metric alongside kg rescued, and (2) a periodic manual review of the Freshness Score's rule thresholds — the MVP itself stays rule-based, but this data collection lays the groundwork for tuning those rules with real field outcomes over time, without requiring a live ML pipeline at MVP scope.

---

## 8. Design System — Key Components

| Component | Implementation Notes |
|---|---|
| Button | 3 variants: primary (solid Harvest Green), secondary (outline), ghost (text only). Sizes sm/md/lg. 8px radius. |
| Status Badge | Pill shape, colored per section 3.2, always paired with a text label — not color alone — for accessibility |
| Card | 12–16px radius, light shadow, 16–24px padding |
| Input/Form Field | Label above the field, 1px Mist border, Harvest Green focus state, Alert Red error state with a message below the field |
| Map Marker | Custom Lucide-style marker colored by status, enlarges on hover/select |
| Navigation Sidebar (desktop) / Bottom Nav (mobile) | Lucide icon + label, active item uses Harvest Green Light as background |
| Modal | 24px radius, overlay with light backdrop blur |
| Toast/Notification | Appears top-right (desktop) or top (mobile), auto-dismisses after 4–5 seconds |
| Empty State | Simple line-art illustration + helpful copy, not just "no data" |
| Achievement Badge | Compact chip/icon with label, used for donor streak and contribution badges (7.10); visually distinct from the Status Badge (freshness/distribution status) so the two are never confused |
| Rating Prompt | Single-question inline card (thumbs up/down or 1–5 scale), shown once on the batch detail page after "Selesai" status (7.11) |

---

## 9. Responsiveness

Recommended breakpoints (following Tailwind CSS conventions, matching the proposal's stack):

| Breakpoint | Width | Main Behavior |
|---|---|---|
| Mobile | < 640px | Bottom navigation, single column, floating action button for the primary action, map and list become separate tabs |
| Tablet | 640–1024px | Sidebar can collapse to icon-only, 2-column card grid |
| Desktop | > 1024px | Full sidebar, split map/list view, 3-column feature grid on the landing page |

Mobile is the top priority for the Donor and Volunteer flows, since field work happens on phones. Desktop is prioritized for the Monitor/Admin role, which relies more on dashboards and aggregate data.

---

## 10. Tech Stack

Follows the stack already defined in the proposal, to stay consistent with the competition documents:

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Animation | GSAP with ScrollTrigger |
| Icons | Lucide Icons |
| Backend/API | Node.js / Express.js |
| Database and Auth | Supabase |
| Maps | Leaflet.js with OpenStreetMap |
| QR | QR Code Generator library |
| Offline draft | LocalStorage |
| WhatsApp notifications | Fonnte API (`api.fonnte.com`), called server-side from Node.js/Express |

Additional recommendations specific to the website implementation:

- **Font loading**: use `next/font` for Instrument Serif and Inter, to avoid a flash of unstyled text.
- **Lightweight state management**: React Context or Zustand is enough for role and filter state — Redux isn't needed at MVP scope.
- **Form handling**: React Hook Form with Zod validation, especially for the Add Surplus form, which has many fields.
- **WhatsApp integration**: keep the Fonnte device token server-side only (environment variable), never exposed to the client. Wrap the send-message call in a small internal helper (e.g. `sendWhatsAppNotification()`) so it's called from the same backend event handlers that already create in-app notifications, rather than duplicating trigger logic.

---

## 11. Phased Implementation Plan

### Phase 0 — Setup and Design Foundation (target: 2–3 days)
- Set up the Next.js + Tailwind project, configure design tokens (color, typography, spacing) per section 3.
- Set up the Supabase project and base database schema (users, surplus_batch, distribution_log, surplus_template, donor_badge/badge view, pickup_rating field).
- Build base design-system components (button, input, card, badge) as reusable components.
- Deliverable: a simple Storybook or an internal `/design-system` page to check component consistency.

### Phase 1 — Landing Page and Authentication (target: 3–4 days)
- Build all landing page sections per section 5, including GSAP animation.
- Build the Login and multi-role Register pages.
- Set up the auth flow with Supabase Auth, including role assignment at registration.
- Deliverable: a live landing page; users can register and log in, then get redirected to an empty dashboard matching their role.

### Phase 2 — Core Donor Flow (target: 5–6 days)
- Donor Dashboard with summary and batch list.
- Full Add Food Surplus form with photo upload, GPS, storage condition input (room temperature/fridge, 7.3), and Freshness and Risk Score calculation.
- Recurring Surplus template creation, scheduling, and one-tap confirmation flow (7.2.1).
- Batch Detail page (donor view).
- Deliverable: a donor can post surplus from scratch through to it appearing with the correct freshness status, and can save/reuse a Recurring Surplus template.

### Phase 3 — Volunteer Flow and Matching (target: 4–5 days)
- Nearby Surplus page with Leaflet map and list, including filtering and sorting.
- Basic smart-matching logic (distance, urgency, capacity, category).
- Claim action and distribution status changes (available, claimed, picked up, completed).
- Pickup Route page.
- Deliverable: a volunteer can find nearby surplus, claim it, and complete the pickup flow end to end.

### Phase 4 — QR Traceability, Impact Dashboard, and Feedback Loop (target: 4–5 days)
- QR generation per batch, public `/scan/:qrcode` page.
- Post-Pickup Rating prompt on the batch detail page once a batch reaches "Selesai" (7.11), stored on the batch record.
- Impact Dashboard with key metrics, trend visualizations, and the condition-match quality metric from pickup ratings.
- History page for all roles.
- Deliverable: a batch can be fully traced from posting to completion via QR, a volunteer can leave a post-pickup rating, and the impact dashboard shows accurate numbers from real data.

### Phase 4.5 — WhatsApp Notifications and Donor Badges (target: 2–3 days)
- Integrate Fonnte API server-side; wire the existing notification events (new nearby surplus, deadline reminders, status changes, recurring surplus confirmation) to also send via WhatsApp, respecting the opt-in from registration/profile.
- Build the badge aggregation query/job over `distribution_log` and the `/app/badges` page, plus the badge strip on the Donor Dashboard.
- Deliverable: a donor/volunteer with WhatsApp notifications enabled receives real WhatsApp alerts for key events, and a donor can see their streak and contribution badges.

### Phase 5 — Polish, Responsiveness, and Accessibility (target: 3 days)
- Full responsive QA across mobile, tablet, and desktop breakpoints.
- Color contrast audit, especially for status badges and text over brand colors.
- Refine GSAP animations, check scroll performance on low-end devices.
- Empty, loading, and error states for all main pages.
- Deliverable: the app feels polished and consistent across devices, ready for demo.

### Phase 6 — Demo Preparation (target: 1–2 days)
- Seed realistic demo data (several donors, several batches at different statuses, enough distribution history to populate the impact dashboard).
- Rehearsed end-to-end demo scenario, matching the MVP success indicators in the proposal (section 4.10).
- Deliverable: the app is ready to present with no empty data or odd states during the live demo.

---

## 12. Success Criteria per Phase

In line with the MVP Success Indicators in the proposal:

- A donor can add a food surplus batch through to its status appearing on the map.
- The system successfully assigns an initial freshness status — green, yellow, or red — with a visible reason.
- A volunteer/receiver can claim a batch and update its distribution status through to completion.
- A batch's QR code can be scanned and shows a short distribution history, without requiring login.
- The dashboard accurately shows total kg of food rescued, estimated portions, and average rescue time, based on real data.
- A donor can save a Recurring Surplus template and confirm a new batch from it in well under the 90-second target.
- A donor or volunteer with WhatsApp notifications enabled receives a WhatsApp message (via Fonnte) for at least the "new nearby surplus" and "batch status change" events, in addition to the in-app notification.
- A donor's streak/contribution badges on `/app/badges` correctly reflect their `distribution_log` history.
- A volunteer can submit a post-pickup rating after a batch is completed, and that rating is visible in the batch's history and reflected in the Impact Dashboard's quality metric.
- The landing page and demo flow can explain the social, technical, and impact value within a short pitch window.

---

## 13. Non-Functional Notes

- **Performance**: landing page targets a Lighthouse Performance score above 85 on a 4G connection, given that GSAP animation and images need optimization (lazy loading, image compression).
- **Basic accessibility**: status colors meet WCAG AA contrast at minimum, all interactive elements are keyboard-accessible, and alt text is provided for all important images.
- **Basic security**: input validation happens server-side (not just client-side), with simple rate limiting on the surplus-submission endpoint to prevent abuse.
- **Minimal data**: per the proposal's constraints, don't store more detailed recipient data than what's needed for basic matching and tracking.
- **Third-party API secrets**: the Fonnte device token is stored as a server-side environment variable and never exposed to the client bundle or API responses.
- **Graceful degradation**: WhatsApp delivery via Fonnte is a fallback, not a dependency — if the Fonnte API is down or the user hasn't opted in, the in-app notification and core flow must still work unaffected.
