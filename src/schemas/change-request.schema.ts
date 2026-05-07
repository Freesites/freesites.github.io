import { z } from 'zod';
import {
  BusinessSchema,
  ServiceSchema,
  HoursSchema,
  EmergencySchema,
  BookingSchema,
  CredentialsSchema,
  SocialSchema,
  ReputationSchema,
  TestimonialSchema,
  PhotoSchema,
  VerticalPlumbingSchema,
  VerticalElectricalSchema,
  VerticalHvacSchema,
  SeoSchema,
} from './content.schema';

// ---------------------------------------------------------------------------
// ContentPatchSchema — the set of fields a client or operator may update.
//
// Intentionally excludes immutable fields:
//   schemaVersion, siteId, createdAt, siteVersion (auto-incremented),
//   lastUpdated (auto-set), isFounderMember (permanent), isBetaClient,
//   verticalType (cannot change vertical after creation).
//
// Uses .strict() so that attempts to patch excluded fields are rejected
// rather than silently ignored.
// ---------------------------------------------------------------------------

export const ContentPatchSchema = z.object({
  // Top-level mutable metadata
  biggestChallenge: z.string().optional(),
  planTier: z.enum(['founding', 'standard', 'premium']).optional(),
  founderBadgeEnabled: z.boolean().optional(),
  domainStatus: z.enum(['preview', 'active', 'suspended']).optional(),

  // Sub-objects — each uses .partial() so callers only need to send
  // the specific nested fields they want to change.
  business: BusinessSchema.partial().optional(),
  services: z.array(ServiceSchema).optional(),
  hours: HoursSchema.partial().optional(),
  emergency: EmergencySchema.partial().optional(),
  booking: BookingSchema.partial().optional(),
  credentials: CredentialsSchema.partial().optional(),
  social: SocialSchema.partial().optional(),
  reputation: ReputationSchema.partial().optional(),
  testimonials: z.array(TestimonialSchema).optional(),
  photos: z.array(PhotoSchema).optional(),
  vertical_plumbing: VerticalPlumbingSchema.partial().optional(),
  vertical_electrical: VerticalElectricalSchema.partial().optional(),
  vertical_hvac: VerticalHvacSchema.partial().optional(),
  seo: SeoSchema.partial().optional(),
}).strict();

// ---------------------------------------------------------------------------
// ChangeRequestSchema — what the portal change-request endpoint receives.
//
// changeNote is required free-text (Phase 1 portal is a single text input).
// patch is optional structured data for when the caller wants to supply
// specific field values instead of relying purely on Claude re-generation.
// ---------------------------------------------------------------------------

export const ChangeRequestSchema = z.object({
  siteId: z.string().min(1),
  requestedBy: z.string().email(),
  requestedAt: z.string().datetime().optional(),
  changeNote: z.string().trim().min(1).max(2000),
  patch: ContentPatchSchema.optional(),
});

export type ContentPatch = z.infer<typeof ContentPatchSchema>;
export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;
