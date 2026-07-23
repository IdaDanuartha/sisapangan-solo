import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SurplusManagementClient } from "@/components/app/SurplusManagementClient";

export default async function SurplusDataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";

  if (role !== "donor" && role !== "admin") {
    redirect("/app/dashboard");
  }

  let query = supabase
    .from("surplus_batch")
    .select("*, profiles:donor_id(name)")
    .order("created_at", { ascending: false });

  if (role !== "admin") {
    query = query.eq("donor_id", user.id);
  }

  const { data: batches } = await query;

  return (
    <SurplusManagementClient
      initialBatches={batches || []}
      currentUserId={user.id}
      currentUserRole={role}
    />
  );
}
