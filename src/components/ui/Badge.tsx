type StatusType = "safe" | "urgent" | "non-consumption";
type BadgeVariant = "status" | "achievement" | "category";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

interface AchievementBadgeProps {
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

interface CategoryBadgeProps {
  label: string;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; border: string; label: string }
> = {
  safe: {
    bg: "bg-[#E8F7ED]",
    text: "text-[#1F7A3B]",
    border: "border-[#3AA65A]",
    label: "Layak Konsumsi",
  },
  urgent: {
    bg: "bg-[#FEF6E4]",
    text: "text-[#A66A00]",
    border: "border-[#F0A93B]",
    label: "Segera Diambil",
  },
  "non-consumption": {
    bg: "bg-[#FAEAEA]",
    text: "text-[#A02020]",
    border: "border-[#D14343]",
    label: "Non-Konsumsi",
  },
};

/** Status Badge — food safety / freshness status. Used consistently everywhere. */
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: "bg-[#F4F6F3]",
    text: "text-[#5B655D]",
    border: "border-[#9AA39C]",
    label: status || "Status",
  };
  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        config.border,
        className,
      ].join(" ")}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

/** Achievement Badge — donor streaks/contribution badges. Visually distinct from StatusBadge. */
export function AchievementBadge({
  label,
  icon,
  className = "",
}: AchievementBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBEBD8] text-[#8A4A00] border border-[#E88C2D]",
        className,
      ].join(" ")}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  );
}

/** Category Badge — food category labels on cards */
export function CategoryBadge({ label, className = "" }: CategoryBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium bg-[#E4F0E8] text-[#2F6E4F]",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/** Distribution status badge */
type DistributionStatus = "Tersedia" | "Diklaim" | "Diambil" | "Selesai";

const distributionConfig: Record<
  DistributionStatus,
  { bg: string; text: string }
> = {
  Tersedia: { bg: "bg-[#E8F7ED]", text: "text-[#1F7A3B]" },
  Diklaim: { bg: "bg-[#FEF6E4]", text: "text-[#A66A00]" },
  Diambil: { bg: "bg-[#E4F0E8]", text: "text-[#2F6E4F]" },
  Selesai: { bg: "bg-[#F4F6F3]", text: "text-[#5B655D]" },
};

export function DistributionBadge({
  status,
  className = "",
}: {
  status: DistributionStatus;
  className?: string;
}) {
  const config = distributionConfig[status] || { bg: "bg-[#F4F6F3]", text: "text-[#5B655D]" };
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className,
      ].join(" ")}
    >
      {status || "Tersedia"}
    </span>
  );
}
