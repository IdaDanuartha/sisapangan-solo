import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";

  return <DashboardContent role={role} userId={user.id} />;
}

import { DonorDashboard } from "@/components/app/DonorDashboard";
import { VolunteerDashboard } from "@/components/app/VolunteerDashboard";
import { AdminDashboard } from "@/components/app/AdminDashboard";

function DashboardContent({
  role,
  userId,
}: {
  role: string;
  userId: string;
}) {
  if (role === "admin" || role === "monitor") {
    return <AdminDashboard role={role} />;
  }
  if (role === "volunteer" || role === "non-consumption") {
    return <VolunteerDashboard userId={userId} role={role} />;
  }
  return <DonorDashboard userId={userId} />;
}
