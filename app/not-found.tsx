import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Página não encontrada</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          O caminho solicitado não existe ou foi movido dentro da plataforma MONO.
        </p>
        <div className="pt-3">
          <Link href="/dashboard">
            <Button
              variant="primary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
