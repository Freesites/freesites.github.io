import { z } from 'zod';
import {
  HoursSchema,
  TestimonialSchema,
  PhotoSchema,
  SocialSchema,
  SeoSchema,
  ServiceSchema,
  VerticalPlumbingSchema,
  VerticalElectricalSchema,
  VerticalHvacSchema,
  VerticalRoofingSchema,
  VerticalChurchSchema,
} from './content.schema';

// ---------------------------------------------------------------------------
// Prompt payload — the flat object embedded as {{CONTENT_JSON}} in prompt
// templates. It is produced by mapContentToPromptPayload() and never stored.
//
// Key differences from the canonical ContentJson:
//   - business.* and business.address.* are promoted to top level
//   - emergency.*, booking.*, credentials.*, reputation.* are promoted
//   - emergencyPhone uses emergency.emergencyPhone (canonical)
//   - showFounderBadge replaces the isFounderMember / founderBadgeEnabled pair
//   - Only the active vertical's sub-object is included (discriminated union)
//   - Internal metadata (schemaVersion, createdAt, etc.) is excluded
// ---------------------------------------------------------------------------

const PromptPayloadBaseSchema = z.object({
  // Meta
  siteId: z.string(),
  verticalType: z.enum(['plumbing', 'electrical', 'hvac', 'roofing', 'church']),
  biggestChallenge: z.string(),
  showFounderBadge: z.boolean(),
  planTier: z.string(),
  pendingChangeNote: z.string().nullable(),

  // Business (flattened from business.*)
  businessName: z.string(),
  tagline: z.string(),
  phone: z.string(),
  email: z.string(),
  ownerName: z.string(),
  yearsInBusiness: z.number().nullable(),
  logoUrl: z.string().nullable(),

  // Address (flattened from business.address.*)
  city: z.string(),
  state: z.string(),
  street: z.string(),
  zip: z.string(),
  serviceAreas: z.array(z.string()),

  // Emergency (flattened from emergency.*)
  emergency24x7: z.boolean(),
  emergencyPhone: z.string(),
  emergencyResponseTime: z.string(),

  // Booking (flattened from booking.*)
  bookingUrl: z.string().nullable(),
  callToBookEnabled: z.boolean(),
  textCommunicationNumber: z.string().nullable(),

  // Credentials (flattened from credentials.*)
  licenseNumber: z.string(),
  insuranceVerified: z.boolean(),
  certifications: z.array(z.string()),

  // Reputation (flattened from reputation.*)
  googleRating: z.number().nullable(),
  reviewCount: z.number().int().nullable(),

  // Arrays — passed through unchanged
  services: z.array(ServiceSchema),
  hours: HoursSchema,
  hoursNote: z.string(),
  testimonials: z.array(TestimonialSchema),
  photos: z.array(PhotoSchema),
  social: SocialSchema,
  seo: SeoSchema,
});

// Discriminated union: only the active vertical's field is present.
// This prevents Claude from referencing data for the wrong vertical.
export const PromptPayloadSchema = z.discriminatedUnion('verticalType', [
  PromptPayloadBaseSchema.extend({
    verticalType: z.literal('plumbing'),
    vertical_plumbing: VerticalPlumbingSchema,
  }),
  PromptPayloadBaseSchema.extend({
    verticalType: z.literal('electrical'),
    vertical_electrical: VerticalElectricalSchema,
  }),
  PromptPayloadBaseSchema.extend({
    verticalType: z.literal('hvac'),
    vertical_hvac: VerticalHvacSchema,
  }),
  PromptPayloadBaseSchema.extend({
    verticalType: z.literal('roofing'),
    vertical_roofing: VerticalRoofingSchema,
  }),
  PromptPayloadBaseSchema.extend({
    verticalType: z.literal('church'),
    vertical_church: VerticalChurchSchema,
  }),
]);

export type PromptPayload = z.infer<typeof PromptPayloadSchema>;
