import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ImpactDashboardClient, SurplusBatchItem } from "@/components/app/ImpactDashboardClient";

export default async function ImpactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: batches } = await supabase
    .from("surplus_batch")
    .select("*")
    .order("created_at", { ascending: false });

  const batchList = (batches as SurplusBatchItem[]) || [];

  // Compute metrics
  const completed = batchList.filter((b) => b.status === "Selesai");
  const totalKg = completed
    .filter((b) => b.unit === "kg")
    .reduce((s, b) => s + Number(b.quantity || 0), 0);
  const totalPortions = Math.round(totalKg / 0.2);
  const activeSurplus = batchList.filter((b) => b.status === "Tersedia" || b.status === "Diklaim").length;

  const categoryBreakdown: Record<string, number> = {};
  completed.forEach((b) => {
    categoryBreakdown[b.category] = (categoryBreakdown[b.category] || 0) + Number(b.quantity || 0);
  });

  const weeklyTrend: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    weeklyTrend[dayName] = 0;
  }
  completed.forEach((b) => {
    const dayName = new Date(b.created_at).toLocaleDateString("id-ID", { weekday: "short" });
    if (weeklyTrend[dayName] !== undefined) {
      weeklyTrend[dayName] += Number(b.quantity || 0);
    }
  });

  return (
    <ImpactDashboardClient
      initialBatches={batchList}
      metrics={{
        totalKg,
        totalPortions,
        activeSurplus,
        completedBatches: completed.length,
      }}
      categoryBreakdown={categoryBreakdown}
      weeklyTrend={weeklyTrend}
    />
  );
}
