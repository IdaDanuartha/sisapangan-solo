import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";
  const name = (user.user_metadata?.name as string) ?? "Pengguna";

  return (
    <AppShell role={role} userName={name}>
      {children}
    </AppShell>
  );
}
