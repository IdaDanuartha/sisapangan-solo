import { type ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "map" | "history";
}

function DefaultIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Plate */}
      <circle cx="60" cy="65" r="36" stroke="#9AA39C" strokeWidth="2" fill="#F4F6F3" />
      <circle cx="60" cy="65" r="26" stroke="#9AA39C" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
      {/* Fork */}
      <line x1="44" y1="45" x2="44" y2="65" stroke="#2F6E4F" strokeWidth="2" strokeLinecap="round" />
      <line x1="41" y1="45" x2="41" y2="52" stroke="#2F6E4F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="45" x2="44" y2="52" stroke="#2F6E4F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="47" y1="45" x2="47" y2="52" stroke="#2F6E4F" strokeWidth="1.5" strokeLinecap="round" />
      {/* Spoon */}
      <line x1="76" y1="55" x2="76" y2="75" stroke="#E88C2D" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="76" cy="50" rx="5" ry="7" stroke="#E88C2D" strokeWidth="1.5" fill="#FBEBD8" />
      {/* Leaf accent */}
      <path d="M55 35 Q60 28 65 35" stroke="#2F6E4F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="25" y="30" width="70" height="65" rx="8" stroke="#9AA39C" strokeWidth="2" fill="#F4F6F3" />
      <line x1="37" y1="50" x2="83" y2="50" stroke="#9AA39C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="62" x2="70" y2="62" stroke="#9AA39C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="74" x2="76" y2="74" stroke="#9AA39C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="87" cy="85" r="16" fill="#E4F0E8" stroke="#2F6E4F" strokeWidth="1.5" />
      <path d="M87 78 L87 86 L92 89" stroke="#2F6E4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const illustrations: Record<
  NonNullable<EmptyStateProps["variant"]>,
  React.ReactNode
> = {
  default: <DefaultIllustration />,
  map: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="52" r="22" stroke="#9AA39C" strokeWidth="2" fill="#F4F6F3" />
      <circle cx="60" cy="52" r="8" fill="#E4F0E8" stroke="#2F6E4F" strokeWidth="1.5" />
      <path d="M60 74 L60 90" stroke="#9AA39C" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="60" cy="92" rx="12" ry="4" fill="#E4F0E8" />
      <circle cx="60" cy="52" r="3" fill="#2F6E4F" />
    </svg>
  ),
  history: <HistoryIllustration />,
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="opacity-80">{icon ?? illustrations[variant]}</div>
      <div className="max-w-xs space-y-1.5">
        <h3 className="text-base font-semibold text-[#1B1F1C]">{title}</h3>
        <p className="text-sm text-[#5B655D] leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
