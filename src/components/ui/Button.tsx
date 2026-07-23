import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#2F6E4F] text-white hover:bg-[#1E4A35] active:bg-[#1E4A35] disabled:bg-[#9AA39C] disabled:cursor-not-allowed",
  secondary:
    "border border-[#2F6E4F] text-[#2F6E4F] bg-transparent hover:bg-[#E4F0E8] active:bg-[#E4F0E8] disabled:border-[#9AA39C] disabled:text-[#9AA39C] disabled:cursor-not-allowed",
  ghost:
    "text-[#2F6E4F] bg-transparent hover:bg-[#E4F0E8] active:bg-[#E4F0E8] disabled:text-[#9AA39C] disabled:cursor-not-allowed",
  danger:
    "bg-[#D14343] text-white hover:bg-[#A02020] active:bg-[#A02020] disabled:bg-[#9AA39C] disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center font-medium rounded-[8px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6E4F] focus-visible:ring-offset-2 select-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">Memuat...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
