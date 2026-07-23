"use client";

import { useEffect, useState } from "react";
import { Bell, Info, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";

interface NotificationLog {
  id: string;
  event_type: string;
  target_number: string;
  sent_at: string;
  surplus_batch?: {
    id: string;
    name: string;
  } | null;
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const role = user.user_metadata?.role as string;

      let query = supabase
        .from("notification_log")
        .select(`
          id, event_type, target_number, sent_at,
          surplus_batch:batch_id(id, name)
        `)
        .order("sent_at", { ascending: false })
        .limit(30);

      // If donor, only show notifications they sent or relate to their batches
      if (role === "donor") {
        query = query.eq("sender_id", user.id);
      }

      const { data } = await query;
      setLogs((data as any[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const getIcon = (type: string) => {
    if (type?.includes("claim") || type?.includes("Klaim")) return <CheckCircle2 size={16} className="text-[#3AA65A]" />;
    if (type?.includes("expiry") || type?.includes("urgensi")) return <AlertTriangle size={16} className="text-[#F0A93B]" />;
    return <Info size={16} className="text-[#2F6E4F]" />;
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B1F1C]">Notifikasi</h1>
        <p className="text-sm text-[#9AA39C]">Log pengiriman pesan penting dan WhatsApp</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="Tidak Ada Notifikasi"
          description="Log notifikasi atau WhatsApp broadcast Anda akan muncul di sini."
          variant="default"
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(log.event_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B1F1C]">
                    {log.event_type || "Pemberitahuan Sistem"}
                  </p>
                  <p className="text-xs text-[#5B655D] mt-0.5">
                    Target: <span className="font-mono">{log.target_number}</span>
                    {log.surplus_batch && ` · Makanan: ${log.surplus_batch.name}`}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#9AA39C] mt-2">
                    <Clock size={10} />
                    <span>{new Date(log.sent_at).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
