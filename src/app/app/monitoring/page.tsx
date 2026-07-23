import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MonitoringClient } from "@/components/app/MonitoringClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monitoring Aktivitas — SisaPangan Solo",
};

export default async function MonitoringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";

  if (role !== "admin" && role !== "monitor") {
    redirect("/app/dashboard");
  }

  return <MonitoringClient role={role} />;
}
