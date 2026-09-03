"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { User, Phone, Fingerprint, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [isDidDocOpen, setIsDidDocOpen] = useState<boolean>(false);

  const did = user?.did || "did:key:z6Mku... (atribuído automaticamente pelo backend)";

  const handleCopyDid = () => {
    if (user?.did) {
      navigator.clipboard.writeText(user.did);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Perfil / Identidade"
        description="Dados da sua conta e identidade descentralizada (DID) registada no ecossistema MONO."
      />

      {/* Secção Perfil */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span>Dados Pessoais</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block mb-1">Nome Completo</span>
            <p className="text-sm font-semibold text-slate-900">
              {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "—"}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Número de Telefone</span>
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {user?.phone_number || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Secção Identidade Descentralizada */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-blue-600" />
            <span>Identificador Descentralizado (DID)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            O seu DID é gerido e atribuído pelo backend de forma soberana. Não requer criação manual.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
                Seu DID
              </span>
              <p className="text-xs sm:text-sm font-mono text-slate-800 break-all bg-white px-3 py-2 rounded-md border border-slate-200 shadow-xs">
                {did}
              </p>
            </div>

            {user?.did && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDid}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                {copied ? "Copiado" : "Copiar DID"}
              </Button>
            )}
          </div>

          {/* Secção Técnica Expansível do DID Document */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDidDocOpen(!isDidDocOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Dados do DID Document (Secção Técnica)</span>
              {isDidDocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isDidDocOpen && (
              <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="text-slate-500">
                  O documento criptográfico é obtido diretamente através do endpoint <code>GET /api/v1/identity/me/document/</code> quando conectado.
                </p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-md text-[11px] overflow-x-auto font-mono">
{JSON.stringify(
  {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: user?.did || "did:key:z6Mku...pending",
    controller: user?.did || "did:key:z6Mku...pending",
    status: "ACTIVE"
  },
  null,
  2
)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
