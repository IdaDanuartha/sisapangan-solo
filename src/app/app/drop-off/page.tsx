import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DropOffManagementClient } from "@/components/app/DropOffManagementClient";

export default async function DropOffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";

  if (role !== "admin") {
    redirect("/app/dashboard");
  }

  return <DropOffManagementClient />;
}
