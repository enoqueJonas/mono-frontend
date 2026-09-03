import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", hasError = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        disabled={disabled}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors shadow-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          hasError
            ? "border-rose-500 focus-visible:ring-rose-500 text-rose-900"
            : "border-slate-200 focus-visible:border-slate-900 focus-visible:ring-slate-900",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
