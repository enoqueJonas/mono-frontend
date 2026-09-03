import { z } from "zod";

export const generateRotationSchema = z.object({
  cycle_number: z
    .number({ message: "Indique o número do ciclo." })
    .int("O número do ciclo deve ser inteiro.")
    .min(1, "O número do ciclo deve ser igual ou superior a 1."),
  contribution_period: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione um período válido."),
});

export type GenerateRotationFormData = z.infer<typeof generateRotationSchema>;
