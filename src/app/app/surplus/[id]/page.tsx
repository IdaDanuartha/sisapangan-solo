import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BatchDetailClient } from "@/components/app/BatchDetailClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("surplus_batch")
    .select("name, category")
    .eq("id", id)
    .single();
  return {
    title: data ? `${data.name} — SisaPangan Solo` : "Detail Surplus",
  };
}

export default async function BatchDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("surplus_batch")
    .select("*, profiles:donor_id(name, type)")
    .eq("id", id)
    .single();

  if (!batch) notFound();

  const { data: logs } = await supabase
    .from("distribution_log")
    .select("*, profiles:volunteer_id(name)")
    .eq("batch_id", id)
    .order("timestamp", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch volunteer verification status (only relevant for volunteer/non-consumption)
  let isVerified = true;
  const role = user?.user_metadata?.role as string | undefined;
  if (user && (role === "volunteer" || role === "non-consumption")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();
    isVerified = profile?.is_verified ?? false;
  }

  return (
    <BatchDetailClient
      batch={batch}
      logs={logs ?? []}
      currentUserId={user?.id ?? null}
      currentUserRole={(user?.user_metadata?.role as string) ?? ""}
      isVerified={isVerified}
    />
  );
}
