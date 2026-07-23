import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { padding = "md", hover = false, className = "", children, ...props },
    ref
  ) => {
    const paddings = {
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    };
    return (
      <div
        ref={ref}
        className={[
          "bg-white rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]",
          paddings[padding],
          hover &&
            "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/** Metric card used on dashboards */
export function MetricCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-[10px] bg-[#E4F0E8] flex items-center justify-center text-[#2F6E4F]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-[#5B655D] font-medium">{label}</p>
        <p
          className="text-3xl font-bold text-[#1B1F1C] tabular-nums leading-tight mt-0.5"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-[#9AA39C] mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
