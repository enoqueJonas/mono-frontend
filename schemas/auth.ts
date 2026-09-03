import { z } from "zod";

/**
 * Esquema de validação para login
 */
export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(1, "O número de telefone é obrigatório.")
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s-]/g, "");
        return /^\+?[0-9]{9,15}$/.test(cleaned);
      },
      {
        message: "Introduza um número de telefone válido (ex: +258841234567).",
      }
    ),
  password: z
    .string()
    .min(1, "A palavra-passe é obrigatória.")
    .min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de validação para registo
 */
export const registerSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "O nome é obrigatório.")
      .min(2, "O nome deve ter pelo menos 2 caracteres."),
    last_name: z
      .string()
      .trim()
      .min(1, "O apelido é obrigatório.")
      .min(2, "O apelido deve ter pelo menos 2 caracteres."),
    phone_number: z
      .string()
      .trim()
      .min(1, "O número de telefone é obrigatório.")
      .refine(
        (val) => {
          const cleaned = val.replace(/[\s-]/g, "");
          return /^\+?[0-9]{9,15}$/.test(cleaned);
        },
        {
          message: "Introduza um número de telefone válido (ex: +258841234567).",
        }
      ),
    password: z
      .string()
      .min(1, "A palavra-passe é obrigatória.")
      .min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
    confirm_password: z
      .string()
      .min(1, "A confirmação da palavra-passe é obrigatória."),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As palavras-passe não coincidem.",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
