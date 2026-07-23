import { createClient } from "@/lib/supabase/server";
import { BadgesClient } from "@/components/app/BadgesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Badge Saya — SisaPangan Solo",
};

export default async function BadgesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch all completed batches by this donor
  const { data: batches } = await supabase
    .from("surplus_batch")
    .select("id, quantity, unit, created_at, category")
    .eq("donor_id", user.id)
    .eq("status", "Selesai")
    .order("created_at", { ascending: false });

  const completedBatches = batches ?? [];

  // Compute badge eligibility
  const totalBatches = completedBatches.length;
  const totalKg = completedBatches
    .filter((b) => b.unit === "kg")
    .reduce((s, b) => s + b.quantity, 0);

  // Consecutive weeks
  const consecutiveWeeks = computeConsecutiveWeeks(completedBatches.map((b) => b.created_at));

  // Unique categories
  const categories = new Set(completedBatches.map((b) => b.category));

  return (
    <BadgesClient
      stats={{
        totalBatches,
        totalKg,
        consecutiveWeeks,
        uniqueCategories: categories.size,
      }}
    />
  );
}

function computeConsecutiveWeeks(dates: string[]): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      const jan1 = new Date(dt.getFullYear(), 0, 1);
      return Math.ceil(
        ((dt.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
      );
    })
  );
  const sorted = [...weeks].sort((a, b) => b - a);
  let streak = 1;
  const currentWeek = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === 1) streak++;
    else break;
  }
  return streak;
}
