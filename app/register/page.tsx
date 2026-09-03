"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Phone, User, CheckCircle2 } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/schemas/auth";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    setSuccessMessage(null);

    try {
      const result = await registerUser({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone_number: data.phone_number.trim(),
        password: data.password,
        confirm_password: data.confirm_password,
      });

      setSuccessMessage(
        result.message || "Conta criada com sucesso! A redireccionar para o login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [field, fieldError] of Object.entries(err.fieldErrors)) {
          const message = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          if (
            field === "first_name" ||
            field === "last_name" ||
            field === "phone_number" ||
            field === "password" ||
            field === "confirm_password"
          ) {
            setError(field as keyof RegisterFormData, { message });
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
            Crie a sua conta de membro para cooperativas e Xitique
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs rounded-xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Registar conta
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Preencha os seus dados para aceder à plataforma
            </p>
          </div>

          <ErrorAlert
            message={globalError}
            onDismiss={() => setGlobalError(null)}
            className="mb-5"
          />

          {successMessage && (
            <div className="mb-5 p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="first_name"
                label="Nome"
                required
                error={errors.first_name?.message}
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Enoque"
                    hasError={!!errors.first_name}
                    className="pl-10"
                    {...register("first_name")}
                  />
                </div>
              </FormField>

              <FormField
                id="last_name"
                label="Apelido"
                required
                error={errors.last_name?.message}
              >
                <Input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Macanda"
                  hasError={!!errors.last_name}
                  {...register("last_name")}
                />
              </FormField>
            </div>

            <FormField
              id="phone_number"
              label="Número de telefone"
              required
              hint="Formato internacional recomendado (ex: +258841234567)"
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
              hint="Pelo menos 6 caracteres"
              error={errors.password?.message}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  hasError={!!errors.password}
                  className="pl-10"
                  {...register("password")}
                />
              </div>
            </FormField>

            <FormField
              id="confirm_password"
              label="Confirmar palavra-passe"
              required
              error={errors.confirm_password?.message}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  hasError={!!errors.confirm_password}
                  className="pl-10"
                  {...register("confirm_password")}
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
                Criar conta
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Já tem uma conta registada?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-900 hover:text-blue-700 underline underline-offset-4 decoration-slate-300 hover:decoration-blue-700"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
