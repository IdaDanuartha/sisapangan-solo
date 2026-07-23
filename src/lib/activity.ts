import { createClient } from "@/lib/supabase/client";

export interface LogActivityParams {
  userId?: string;
  userName?: string;
  role?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Client-side utility to log user activity.
 */
export async function logUserActivity(params: LogActivityParams) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !params.userId) return;

    const activeUserId = params.userId || user?.id;
    let userRole = params.role;
    let userName = params.userName;

    if (activeUserId && (!userRole || !userName)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", activeUserId)
        .single();

      if (profile) {
        if (!userRole) userRole = profile.role;
        if (!userName) userName = profile.name;
      }
    }

    await supabase.from("user_activity_log").insert({
      user_id: activeUserId,
      user_name: userName || "Pengguna SisaPangan",
      role: userRole || "donor",
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      metadata: params.metadata || null,
    });
  } catch (err) {
    console.error("[ActivityLog] Failed to record activity:", err);
  }
}
