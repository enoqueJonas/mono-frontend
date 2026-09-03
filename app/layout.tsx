import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "MONO - Sistema de Segurança para Xitique",
  description:
    "Sistema de segurança baseado em blockchain e identidade descentralizada para cooperativas financeiras informais (Xitique).",
  openGraph: {
    title: "MONO - Sistema de Segurança para Xitique",
    description:
      "Sistema de segurança baseado em blockchain e identidade descentralizada para cooperativas financeiras informais (Xitique).",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

