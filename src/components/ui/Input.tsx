"use client";

import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#1B1F1C]"
        >
          {label}
          {props.required && (
            <span className="text-[#D14343] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39C] pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
              undefined
            }
            aria-invalid={error ? "true" : undefined}
            className={[
              "w-full h-10 px-3 rounded-[8px] text-sm text-[#1B1F1C] bg-white border transition-colors duration-150",
              "placeholder:text-[#9AA39C]",
              "focus:outline-none focus:ring-2 focus:ring-[#2F6E4F] focus:border-[#2F6E4F]",
              "disabled:bg-[#F4F6F3] disabled:text-[#9AA39C] disabled:cursor-not-allowed",
              leftIcon ? "pl-9" : "",
              error
                ? "border-[#D14343] focus:ring-[#D14343] focus:border-[#D14343]"
                : "border-[#9AA39C]",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-[#9AA39C]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[#D14343]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/** Textarea variant */
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-[#1B1F1C]"
        >
          {label}
          {props.required && (
            <span className="text-[#D14343] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={[
            "w-full px-3 py-2.5 rounded-[8px] text-sm text-[#1B1F1C] bg-white border transition-colors duration-150 resize-none",
            "placeholder:text-[#9AA39C]",
            "focus:outline-none focus:ring-2 focus:ring-[#2F6E4F] focus:border-[#2F6E4F]",
            error
              ? "border-[#D14343] focus:ring-[#D14343]"
              : "border-[#9AA39C]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[#D14343]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#9AA39C]">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/** Select variant */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, className = "", id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[#1B1F1C]"
        >
          {label}
          {props.required && (
            <span className="text-[#D14343] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          className={[
            "w-full h-10 px-3 rounded-[8px] text-sm text-[#1B1F1C] bg-white border transition-colors duration-150 appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[#2F6E4F] focus:border-[#2F6E4F]",
            "disabled:bg-[#F4F6F3] disabled:text-[#9AA39C] disabled:cursor-not-allowed",
            error ? "border-[#D14343]" : "border-[#9AA39C]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[#D14343]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
