import { createClient } from "@/lib/supabase/server";
import { HistoryClient } from "@/components/app/HistoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat Distribusi — SisaPangan Solo",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = user.user_metadata?.role as string;

  let batches: any[] = [];

  if (role === "admin" || role === "monitor") {
    // Admin / Monitor — fetch all history
    const { data } = await supabase
      .from("surplus_batch")
      .select("*, profiles:donor_id(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    batches = data ?? [];
  } else if (role === "donor") {
    const { data } = await supabase
      .from("surplus_batch")
      .select("*, profiles:donor_id(name)")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    batches = data ?? [];
  } else {
    // Volunteer / non-consumption — fetch via distribution_log
    const { data: logs } = await supabase
      .from("distribution_log")
      .select("batch_id, status, timestamp")
      .eq("volunteer_id", user.id)
      .order("timestamp", { ascending: false });

    const batchIds = [...new Set((logs ?? []).map((l: any) => l.batch_id))];
    if (batchIds.length > 0) {
      const { data } = await supabase
        .from("surplus_batch")
        .select("*, profiles:donor_id(name)")
        .in("id", batchIds);
      batches = data ?? [];
    }
  }


  return <HistoryClient batches={batches} role={role} />;
}
