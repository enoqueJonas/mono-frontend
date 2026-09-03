"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro global:", error);
  }, [error]);

  return (
    <html lang="pt">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 text-center space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900">
            Ocorreu um erro no sistema
          </h2>
          <p className="text-sm text-slate-500">
            {error?.message || "Ocorreu uma falha no carregamento inicial da plataforma."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
