import { z } from "zod";

export const createPenaltySchema = z.object({
  member_id: z.string().trim().min(1, "Seleccione o membro."),
  reason: z.string().trim().min(1, "O motivo é obrigatório."),
});

export type CreatePenaltyFormData = z.infer<typeof createPenaltySchema>;
