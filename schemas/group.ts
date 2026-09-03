import { z } from "zod";

/**
 * Esquema de validação para criação de grupo Xitique
 * Respeita estritamente o payload exigido pelo backend
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do grupo é obrigatório.")
    .max(120, "O nome não pode exceder 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(500, "A descrição não pode exceder 500 caracteres."),
  settings: z.object({
    contribution_amount: z
      .string()
      .trim()
      .min(1, "O valor da contribuição é obrigatório.")
      .refine(
        (val) => {
          const num = parseFloat(val.replace(",", "."));
          return !isNaN(num) && num > 0;
        },
        { message: "O valor da contribuição deve ser superior a zero." }
      ),
    contribution_frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
    maximum_members: z
      .number({ message: "Indique o número de membros." })
      .int("O número de membros deve ser um valor inteiro.")
      .min(2, "O grupo necessita de pelo menos 2 membros.")
      .max(100, "O limite máximo é de 100 membros."),
    rotation_strategy: z.enum(["FIXED_ORDER", "RANDOM"]),
    requires_consensus: z.boolean(),
    allow_manual_contributions: z.boolean(),
    currency: z.string().trim().min(1, "A moeda é obrigatória."),
  }),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

/**
 * Esquema de validação para adicionar membro ao grupo
 * Payload estrito: { phone_number: "+258841234567" }
 */
export const addMemberSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .min(1, "O número de telefone é obrigatório.")
    .regex(
      /^\+?[0-9\s-]{9,20}$/,
      "Introduza um número de telefone válido (ex: +258841234567)."
    ),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

/**
 * Esquema de validação para atualizar configurações do grupo
 * Respeita estritamente os campos suportados pelo backend
 */
export const updateSettingsSchema = z.object({
  contribution_amount: z
    .string()
    .trim()
    .min(1, "O valor da contribuição é obrigatório.")
    .refine(
      (val) => {
        const num = parseFloat(val.replace(",", "."));
        return !isNaN(num) && num > 0;
      },
      { message: "O valor da contribuição deve ser superior a zero." }
    ),
  currency: z.string().trim().min(1, "A moeda é obrigatória."),
  contribution_frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  maximum_members: z
    .number({ message: "Indique o número de membros." })
    .int("O número de membros deve ser um valor inteiro.")
    .min(2, "O grupo necessita de pelo menos 2 membros.")
    .max(100, "O limite máximo é de 100 membros."),
  rotation_strategy: z.enum(["FIXED_ORDER", "RANDOM"]),
  requires_consensus: z.boolean(),
  allow_manual_contributions: z.boolean(),
});

export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>;
