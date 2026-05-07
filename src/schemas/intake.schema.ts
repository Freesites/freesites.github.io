import { z } from 'zod';

// ---------------------------------------------------------------------------
// Biggest-challenge dropdown values — must match the intake form exactly.
// Used in prompt logic to select conditional hero headlines.
// ---------------------------------------------------------------------------

export const BIGGEST_CHALLENGE_VALUES = [
  "I'm not getting enough calls from new customers",
  "Customers can't find me online when they search",
  "I look less professional than my competitors",
  "I'm missing calls after hours and on weekends",
  "I don't have a way to show off my reviews",
  "My current website is outdated or hard to update",
  "I'm spending money on ads but getting no results",
  "Other",
] as const;

export const BiggestChallengeSchema = z.enum(BIGGEST_CHALLENGE_VALUES);
export type BiggestChallenge = z.infer<typeof BiggestChallengeSchema>;

// ---------------------------------------------------------------------------
// Intake schema — validates raw form submission before the defaults factory
// converts it into a full ContentJson record.
//
// Rules:
//   - Required fields are the minimum needed to generate a site.
//   - Optional fields default to empty / null / false so the factory
//     never receives undefined for structured fields.
//   - No normalization transforms here — normalization happens in the
//     factory so the schema stays easy to read and test separately.
// ---------------------------------------------------------------------------

export const IntakeSchema = z.object({
  // -------------------------------------------------------------------------
  // Required
  // -------------------------------------------------------------------------
  businessName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(2).max(50),
  verticalType: z.enum(['plumbing', 'electrical', 'hvac', 'roofing', 'church']),
  biggestChallenge: BiggestChallengeSchema,

  // -------------------------------------------------------------------------
  // Business details — optional at intake, common to fill in later
  // -------------------------------------------------------------------------
  tagline: z.string().trim().max(200).optional().default(''),
  ownerName: z.string().trim().max(100).optional().default(''),
  yearsInBusiness: z.number().int().min(0).max(150).nullable().optional().default(null),
  street: z.string().trim().max(200).optional().default(''),
  zip: z.string().trim().max(10).optional().default(''),
  serviceAreas: z.array(z.string().trim().min(1)).max(25).optional().default([]),

  // -------------------------------------------------------------------------
  // Services offered
  // -------------------------------------------------------------------------
  services: z.array(
    z.object({
      name: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500).default(''),
      featured: z.boolean().default(false),
    })
  ).max(25).optional().default([]),

  // -------------------------------------------------------------------------
  // Emergency
  // -------------------------------------------------------------------------
  emergency24x7: z.boolean().optional().default(false),
  emergencyPhone: z.string().trim().max(20).optional().default(''),
  emergencyResponseTime: z.string().trim().max(100).optional().default(''),

  // -------------------------------------------------------------------------
  // Booking
  // Accepted as a plain string at intake; the factory normalizes to null or a
  // full URL. Strict .url() validation is not applied here because contractors
  // commonly omit the https:// scheme.
  // -------------------------------------------------------------------------
  bookingUrl: z.string().trim().max(300).nullable().optional().default(null),

  // -------------------------------------------------------------------------
  // Credentials
  // -------------------------------------------------------------------------
  licenseNumber: z.string().trim().max(50).optional().default(''),
  insuranceVerified: z.boolean().optional().default(false),

  // -------------------------------------------------------------------------
  // Reputation
  // -------------------------------------------------------------------------
  googleRating: z.number().min(1).max(5).nullable().optional().default(null),
  reviewCount: z.number().int().nonnegative().nullable().optional().default(null),

  // -------------------------------------------------------------------------
  // Business hours — free-text for MVP (e.g. "Mon–Fri 7am–6pm, Sat 8am–2pm")
  // -------------------------------------------------------------------------
  hoursText: z.string().trim().max(500).optional().default(''),

  // -------------------------------------------------------------------------
  // Social / profile links
  // -------------------------------------------------------------------------
  googleProfileUrl: z.string().trim().max(300).optional().default(''),
  facebookUrl: z.string().trim().max(300).optional().default(''),
  thumbtackUrl: z.string().trim().max(300).optional().default(''),

  // -------------------------------------------------------------------------
  // Logo upload — base64 DataURL + MIME type from the browser FileReader API.
  // Extracted by the intake function before persisting; never stored in
  // ContentJson directly (logo is stored in Netlify Blobs and referenced by URL).
  // -------------------------------------------------------------------------
  logoBase64: z.string().optional(),
  logoMimeType: z.string().optional(),

  // -------------------------------------------------------------------------
  // Plan flags — typically set by the operator, not the public form.
  // isBetaClient bypasses Stripe; isFounderMember controls the footer badge.
  // -------------------------------------------------------------------------
  planTier: z.enum(['founding', 'standard', 'premium']).optional().default('founding'),
  isFounderMember: z.boolean().optional().default(false),
  isBetaClient: z.boolean().optional().default(false),
});

export type IntakeFormData = z.infer<typeof IntakeSchema>;
