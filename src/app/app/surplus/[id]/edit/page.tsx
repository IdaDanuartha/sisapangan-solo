import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { EditSurplusClient } from "@/components/app/EditSurplusClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSurplusPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("surplus_batch")
    .select("*, profiles:donor_id(name, type)")
    .eq("id", id)
    .single();

  if (!batch) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "donor";
  const isOwner = batch.donor_id === user.id;

  if (!isOwner && role !== "admin") {
    redirect(`/app/surplus/${id}`);
  }

  return (
    <EditSurplusClient
      batch={batch}
      currentUserId={user.id}
      currentUserRole={role}
    />
  );
}
