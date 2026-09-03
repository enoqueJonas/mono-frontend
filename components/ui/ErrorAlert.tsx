import React from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorAlertProps {
  title?: string;
  message?: string | null;
  action?: React.ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = "Ocorreu um erro",
  message,
  action,
  onRetry,
  onDismiss,
  className,
}: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm space-y-0.5">
          {title && <p className="font-semibold text-rose-950">{title}</p>}
          <p className="text-rose-800 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        {action}
        {!action && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-xs font-semibold transition-colors min-h-[36px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-600 hover:text-rose-900 p-1 rounded focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Fechar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
