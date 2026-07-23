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
    <Card className="flex flex-col xs:flex-row xs:items-start gap-2 xs:gap-4 p-3 xs:p-5">
      {icon && (
        <div className="hidden xs:flex flex-shrink-0 w-10 h-10 xs:w-12 xs:h-12 rounded-[10px] bg-[#E4F0E8] items-center justify-center text-[#2F6E4F]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-[10px] xs:text-sm text-[#5B655D] font-medium leading-tight">{label}</p>
        <p
          className="text-xl xs:text-3xl font-bold text-[#1B1F1C] tabular-nums leading-tight mt-0.5"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>
        {sub && <p className="text-[9px] xs:text-xs text-[#9AA39C] mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
