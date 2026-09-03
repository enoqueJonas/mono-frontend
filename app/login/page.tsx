"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Phone } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      await login({
        phone_number: data.phone_number.trim(),
        password: data.password,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        // Aplica erros por campo do Django REST Framework
        for (const [field, fieldError] of Object.entries(err.fieldErrors)) {
          const message = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          if (field === "phone_number" || field === "password") {
            setError(field as keyof LoginFormData, { message });
          } else {
            setGlobalError(message);
          }
        }
      } else {
        setGlobalError(extractErrorMessage(err));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Identidade MONO - Clean Minimalism */}
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs mb-3">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            MONO
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xs">
            Sistema de segurança para cooperativas financeiras e Xitique
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs rounded-xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Entrar na conta
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Introduza o seu número de telefone e a sua palavra-passe
            </p>
          </div>

          <ErrorAlert
            message={globalError}
            onDismiss={() => setGlobalError(null)}
            className="mb-5"
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              id="phone_number"
              label="Número de telefone"
              required
              error={errors.phone_number?.message}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  id="phone_number"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+258841234567"
                  hasError={!!errors.phone_number}
                  className="pl-10"
                  {...register("phone_number")}
                />
              </div>
            </FormField>

            <FormField
              id="password"
              label="Palavra-passe"
              required
              error={errors.password?.message}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  hasError={!!errors.password}
                  className="pl-10"
                  {...register("password")}
                />
              </div>
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full"
              >
                Entrar
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="font-semibold text-slate-900 hover:text-blue-700 underline underline-offset-4 decoration-slate-300 hover:decoration-blue-700"
              >
                Registar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Plataforma segura com integridade criptográfica e governança distribuída
        </p>
      </div>
    </div>
  );
}
