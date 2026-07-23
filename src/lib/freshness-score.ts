/**
 * Freshness and Risk Score — Rule-based calculation (not AI/ML).
 * PRD §7.3 — Displayed as green/yellow/red badge with a reason string.
 *
 * Factors:
 *  1. Food category (inherent spoilage risk)
 *  2. Storage condition (room temp vs. fridge)
 *  3. Time remaining before estimated expiry
 */

export type FreshnessStatus = "safe" | "urgent" | "non-consumption";

export type FoodCategory =
  | "Makanan Matang"
  | "Buah Potong"
  | "Roti/Bakery"
  | "Sayuran"
  | "Bahan Segar"
  | "Pakan/Kompos"
  | "Lainnya";

export type StorageCondition = "suhu_ruang" | "kulkas" | null;

export interface FreshnessInput {
  category: FoodCategory;
  estimatedExpiryAt: Date;
  storageCondition?: StorageCondition;
  submittedAt?: Date;
  physicalCondition?: FreshnessStatus;
}

export interface FreshnessResult {
  status: FreshnessStatus;
  reason: string;
  hoursRemaining: number;
  /** safe threshold in hours for this food/storage combo */
  safeThresholdHours: number;
  urgentThresholdHours: number;
}

/**
 * Category base thresholds (hours from now to expiry):
 * - safe:             > safeThreshold
 * - urgent:           urgentThreshold < x <= safeThreshold
 * - non-consumption:  <= urgentThreshold
 */
const categoryThresholds: Record<
  FoodCategory,
  { safe: number; urgent: number }
> = {
  "Makanan Matang": { safe: 4, urgent: 1 },
  "Buah Potong":    { safe: 6, urgent: 2 },
  "Roti/Bakery":    { safe: 12, urgent: 3 },
  "Sayuran":        { safe: 24, urgent: 6 },
  "Bahan Segar":    { safe: 24, urgent: 8 },
  "Pakan/Kompos":   { safe: 24, urgent: 6 },
  "Lainnya":        { safe: 12, urgent: 3 },
};

/**
 * Storage condition modifiers — multiplied on the safe/urgent threshold hours.
 * Refrigerated food stays safe longer → thresholds expand (÷ modifier < 1).
 * Room temperature → thresholds shrink.
 *
 * "null" means donor didn't specify → default = room temperature for Makanan
 * Matang & Bahan Segar, fridge for others. Conservative default.
 */
function getStorageModifier(
  category: FoodCategory,
  condition: StorageCondition
): number {
  const refrigerationBenefitCategories: FoodCategory[] = [
    "Makanan Matang",
    "Buah Potong",
    "Bahan Segar",
  ];

  if (condition === "kulkas" && refrigerationBenefitCategories.includes(category)) {
    return 2.5; // refrigerated extends safe window ~2.5×
  }
  if (condition === "suhu_ruang" && refrigerationBenefitCategories.includes(category)) {
    return 1.0; // room temp is the baseline
  }
  // null / unknown → conservative (room temp equivalent)
  return 1.0;
}

/** Format hours into human-readable Indonesian string showing days, hours, and minutes */
function formatHoursId(hours: number): string {
  if (hours <= 0) return "0 menit";

  const totalMinutes = Math.round(hours * 60);
  const d = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = totalMinutes % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0 || parts.length === 0) parts.push(`${m} menit`);

  return parts.join(" ");
}

const categoryLabels: Record<FoodCategory, string> = {
  "Makanan Matang": "makanan matang",
  "Buah Potong":    "buah potong",
  "Roti/Bakery":    "roti/bakery",
  "Sayuran":        "sayuran",
  "Bahan Segar":    "bahan segar",
  "Pakan/Kompos":   "pakan/kompos",
  "Lainnya":        "kategori lainnya",
};

const storageLabels: Record<Exclude<StorageCondition, null>, string> = {
  suhu_ruang: "disimpan di suhu ruang",
  kulkas:     "disimpan di kulkas",
};

export function calculateFreshness(input: FreshnessInput): FreshnessResult {
  const now = input.submittedAt ?? new Date();
  const hoursRemaining =
    (input.estimatedExpiryAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  const base = categoryThresholds[input.category];
  const modifier = getStorageModifier(
    input.category,
    input.storageCondition ?? null
  );

  const safeThresholdHours = base.safe * modifier;
  const urgentThresholdHours = base.urgent * modifier;

  let timeStatus: FreshnessStatus;

  if (hoursRemaining <= 0) {
    timeStatus = "non-consumption";
  } else if (hoursRemaining <= urgentThresholdHours) {
    timeStatus = "non-consumption";
  } else if (hoursRemaining <= safeThresholdHours) {
    timeStatus = "urgent";
  } else {
    timeStatus = "safe";
  }

  // Combine with physical condition (AI recommendation)
  let status = timeStatus;
  if (input.physicalCondition) {
    const rankMap: Record<FreshnessStatus, number> = {
      "non-consumption": 1,
      "urgent": 2,
      "safe": 3,
    };
    if (rankMap[input.physicalCondition] < rankMap[timeStatus]) {
      status = input.physicalCondition;
    }
  }

  let statusLabel: string;
  if (status === "non-consumption") {
    statusLabel = "status: alihkan ke non-konsumsi";
  } else if (status === "urgent") {
    statusLabel = "status: segera diambil";
  } else {
    statusLabel = "status: layak konsumsi";
  }

  // Build reason string in Indonesian
  const parts: string[] = [
    `Kategori ${categoryLabels[input.category]}`,
  ];
  if (input.storageCondition) {
    parts.push(storageLabels[input.storageCondition]);
  }
  if (hoursRemaining > 0) {
    parts.push(`sisa waktu ${formatHoursId(hoursRemaining)}`);
  }
  parts.push(statusLabel);

  return {
    status,
    reason: parts.join(", "),
    hoursRemaining: Math.max(0, hoursRemaining),
    safeThresholdHours,
    urgentThresholdHours,
  };
}
