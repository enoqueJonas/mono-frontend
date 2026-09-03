import { z } from "zod";

export const issueCredentialSchema = z
  .object({
    group_id: z.string().trim().min(1, "Seleccione o grupo."),
    group_member_id: z.string().trim().min(1, "Seleccione o membro."),
    period_start: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione a data inicial."),
    period_end: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione a data final."),
  })
  .refine((data) => data.period_end >= data.period_start, {
    path: ["period_end"],
    message: "A data final deve ser igual ou posterior à data inicial.",
  });

export type IssueCredentialFormData = z.infer<typeof issueCredentialSchema>;

export const verifyCredentialSchema = z.object({
  credential_json: z
    .string()
    .trim()
    .min(1, "Introduza a credencial em formato JSON.")
    .refine((value) => {
      try {
        const parsed = JSON.parse(value);
        return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, "Introduza um objecto JSON válido."),
});

export type VerifyCredentialFormData = z.infer<typeof verifyCredentialSchema>;

export const revokeCredentialSchema = z.object({
  reason: z.string().trim().max(500, "O motivo não pode exceder 500 caracteres."),
});

export type RevokeCredentialFormData = z.infer<typeof revokeCredentialSchema>;
