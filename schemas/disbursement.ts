import { z } from "zod";

export const createDisbursementSchema = z.object({
  cycle_number: z
    .number({ message: "Indique o número do ciclo." })
    .int("O ciclo deve ser um número inteiro.")
    .min(1, "O ciclo deve ser igual ou superior a 1."),
});

export type CreateDisbursementFormData = z.infer<typeof createDisbursementSchema>;
