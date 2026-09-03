"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Ocorreu um erro inesperado
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {error.message ||
            "Ocorreu uma falha temporária. Pode tentar recarregar a interface."}
        </p>
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            Recarregar página
          </Button>
        </div>
      </div>
    </div>
  );
}
