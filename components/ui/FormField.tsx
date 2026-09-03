import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  id?: string;
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  required = false,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5 w-full text-left", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-800 select-none"
          >
            {label}
            {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      <div>{children}</div>

      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}

      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-rose-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-rose-600" />
          {error}
        </p>
      )}
    </div>
  );
}
