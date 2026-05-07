import { z } from 'zod';
import { IntakeSchema } from './intake.schema';

// ---------------------------------------------------------------------------
// PublicIntakeSchema — the shape accepted by the public /api/intake endpoint.
//
// Derived from IntakeSchema by omitting every admin-only flag:
//   isBetaClient   — server derives this from betaCode validation
//   isFounderMember — server sets this for all Phase 1 intake
//   planTier        — server locks this to 'founding' for Phase 1
//
// Because these fields don't exist in the public schema, Zod strips them
// from the parsed output. An attacker who sends { "isBetaClient": true }
// in the request body gets it silently dropped, not passed through.
//
// betaCode is accepted as public input but is never persisted — it is
// consumed by the handler for server-side validation only.
// ---------------------------------------------------------------------------

export const PublicIntakeSchema = IntakeSchema.omit({
  isBetaClient: true,
  isFounderMember: true,
  planTier: true,
}).extend({
  betaCode: z.string().trim().optional(),
});

export type PublicIntakeFormData = z.infer<typeof PublicIntakeSchema>;
