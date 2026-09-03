import { z } from "zod";

export const createContributionSchema = z.object({
  group_member_id: z.string().trim().min(1, "Seleccione o membro."),
  amount: z
    .string()
    .trim()
    .min(1, "O valor é obrigatório.")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.replace(",", ".")), {
      message: "Introduza um valor monetário válido.",
    })
    .refine((value) => Number(value.replace(",", ".")) > 0, {
      message: "O valor deve ser superior a zero.",
    }),
  contribution_period: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione um período válido."),
});

export type CreateContributionFormData = z.infer<typeof createContributionSchema>;
