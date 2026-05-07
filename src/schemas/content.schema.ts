import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas — exported individually so prompt-payload and change-request
// schemas can import and extend them without re-declaring.
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  street: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  zip: z.string().default(''),
});

export const ServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  featured: z.boolean().default(false),
});

export const HoursSchema = z.object({
  mon: z.string().default(''),
  tue: z.string().default(''),
  wed: z.string().default(''),
  thu: z.string().default(''),
  fri: z.string().default(''),
  sat: z.string().default(''),
  sun: z.string().default(''),
  // Mirrors emergency.emergency24x7 — both are set together on write.
  // Read emergency.emergency24x7 as the canonical source; this field is
  // kept only so hour-display logic can inspect it without importing
  // the emergency sub-object.
  emergencyService: z.boolean().default(false),
  // Free-text hours summary submitted at intake (e.g. "Mon–Fri 7am–6pm").
  // Takes precedence over structured day fields when non-empty.
  hoursNote: z.string().default(''),
});

export const EmergencySchema = z.object({
  emergency24x7: z.boolean().default(false),
  emergencyPhone: z.string().default(''),
  emergencyResponseTime: z.string().default(''),
});

export const BookingSchema = z.object({
  bookingUrl: z.string().nullable().default(null),
  callToBookEnabled: z.boolean().default(false),
  textCommunicationNumber: z.string().nullable().default(null),
});

export const CredentialsSchema = z.object({
  licenseNumber: z.string().default(''),
  insuranceVerified: z.boolean().default(false),
  certifications: z.array(z.string()).default([]),
});

export const SocialSchema = z.object({
  facebook: z.string().nullable().default(null),
  google: z.string().nullable().default(null),
  yelp: z.string().nullable().default(null),
  nextdoor: z.string().nullable().default(null),
  thumbtack: z.string().nullable().default(null),
});

export const ReputationSchema = z.object({
  googleRating: z.number().min(1).max(5).nullable().default(null),
  reviewCount: z.number().int().nonnegative().nullable().default(null),
  // Reserved for future automated review-import agents.
  // Not sent to Claude in Phase 1 — use testimonials[] for display.
  featuredReviews: z.array(z.string()).default([]),
});

export const TestimonialSchema = z.object({
  text: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5).default(5),
  source: z.string().default('google'),
});

export const PhotoSchema = z.object({
  url: z.string(),
  caption: z.string().default(''),
  type: z.enum(['work', 'team', 'equipment', 'before_after']).default('work'),
});

export const BusinessSchema = z.object({
  name: z.string().default(''),
  tagline: z.string().default(''),
  phone: z.string().default(''),
  // DEPRECATED: use emergency.emergencyPhone. Kept for migration only.
  // Always write '' for new records. Mapper falls back to this if
  // emergency.emergencyPhone is empty.
  emergencyPhone: z.string().default(''),
  email: z.string().default(''),
  address: AddressSchema.default({}),
  serviceAreas: z.array(z.string()).default([]),
  ownerName: z.string().default(''),
  yearsInBusiness: z.number().int().nonnegative().nullable().default(null),
  logoUrl: z.string().nullable().default(null),
});

export const VerticalPlumbingSchema = z.object({
  drainSpecialty: z.boolean().default(false),
  waterHeaterBrands: z.array(z.string()).default([]),
  emergencyRepair: z.boolean().default(false),
  sumpPump: z.boolean().default(false),
});

export const VerticalElectricalSchema = z.object({
  panelUpgrade: z.boolean().default(false),
  evCharging: z.boolean().default(false),
  generatorInstall: z.boolean().default(false),
  commercialService: z.boolean().default(false),
});

export const VerticalHvacSchema = z.object({
  brandsServiced: z.array(z.string()).default([]),
  maintenancePlans: z.boolean().default(false),
  financingAvailable: z.boolean().default(false),
  seasonalServices: z.array(z.string()).default([]),
});

export const VerticalRoofingSchema = z.object({
  residentialRoofing: z.boolean().default(false),
  commercialRoofing: z.boolean().default(false),
  roofingMaterials: z.array(z.string()).default([]),
  stormDamageRepair: z.boolean().default(false),
  freeInspection: z.boolean().default(false),
  insuranceClaims: z.boolean().default(false),
});

export const VerticalChurchSchema = z.object({
  denomination: z.string().nullable().default(null),
  weeklyServices: z.string().nullable().default(null),
  communityPrograms: z.array(z.string()).default([]),
  streamingAvailable: z.boolean().default(false),
  youthPrograms: z.boolean().default(false),
});

export const SeoSchema = z.object({
  metaTitle: z.string().nullable().default(null),
  metaDescription: z.string().nullable().default(null),
  lastOptimized: z.string().nullable().default(null),
});

// ---------------------------------------------------------------------------
// ChangeHistoryEntrySchema — one entry per client-submitted change request.
// ---------------------------------------------------------------------------

export const ChangeHistoryEntrySchema = z.object({
  requestedAt: z.string().datetime(),
  note: z.string(),
});

// ---------------------------------------------------------------------------
// BillingSchema — Stripe payment state and activation tracking.
// ---------------------------------------------------------------------------

export const BillingSchema = z.object({
  stripeCheckoutSessionId: z.string().nullable().default(null),
  // Stored at checkout-creation time so we can return it on retry without
  // hitting Stripe again (Stripe session URLs expire but we have a window).
  stripeCheckoutUrl: z.string().nullable().default(null),
  stripeCustomerId: z.string().nullable().default(null),
  activatedAt: z.string().datetime().nullable().default(null),
  planActivated: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// DeploymentSchema — generation and deployment state for the current site
// version. The lock fields (runId, lockAcquiredAt) implement the per-site
// optimistic lock described in the orchestrator.
// ---------------------------------------------------------------------------

export const DeploymentSchema = z.object({
  // Lock: set by the orchestrator when it starts; verified on read-back.
  runId: z.string().nullable().default(null),
  lockAcquiredAt: z.string().datetime().nullable().default(null),

  // Netlify identifiers — persisted after first creation so we skip
  // redundant createSite API calls on retries.
  netlifySiteId: z.string().nullable().default(null),
  netlifyDeployId: z.string().nullable().default(null),

  // Outcome
  deployedUrl: z.string().nullable().default(null),
  deployedAt: z.string().datetime().nullable().default(null),
  lastGeneratedAt: z.string().datetime().nullable().default(null),
  failureReason: z.string().nullable().default(null),
  healthCheckPassed: z.boolean().nullable().default(null),

  // Email idempotency guards — skip re-sending if already sent.
  successEmailSentAt: z.string().datetime().nullable().default(null),
  failureEmailSentAt: z.string().datetime().nullable().default(null),
});

// ---------------------------------------------------------------------------
// Root content schema — canonical stored shape for a client record.
// schemaVersion lets future code detect and migrate old records.
// ---------------------------------------------------------------------------

export const ContentSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  siteId: z.string().min(1),
  createdAt: z.string().datetime(),
  lastUpdated: z.string().datetime(),
  siteVersion: z.number().int().positive().default(1),
  planTier: z.enum(['founding', 'standard', 'premium']).default('founding'),
  isFounderMember: z.boolean().default(false),
  isBetaClient: z.boolean().default(false),
  founderBadgeEnabled: z.boolean().default(false),
  domainStatus: z.enum(['preview', 'active', 'suspended']).default('preview'),
  // draft → pending_payment → active
  // Existing records without this field parse to 'draft' via the default.
  activationStatus: z.enum(['draft', 'pending_payment', 'active']).default('draft'),
  // idle → generating → generated → deploying → deployed | failed
  deploymentStatus: z.enum(['idle', 'generating', 'generated', 'deploying', 'deployed', 'failed']).default('idle'),
  biggestChallenge: z.string().default(''),
  billing: BillingSchema.default({}),
  deployment: DeploymentSchema.default({}),

  business: BusinessSchema.default({}),
  services: z.array(ServiceSchema).default([]),
  hours: HoursSchema.default({}),
  emergency: EmergencySchema.default({}),
  booking: BookingSchema.default({}),
  credentials: CredentialsSchema.default({}),
  social: SocialSchema.default({}),
  reputation: ReputationSchema.default({}),
  testimonials: z.array(TestimonialSchema).default([]),
  photos: z.array(PhotoSchema).default([]),

  // verticalType has no default — it must be set explicitly at intake.
  verticalType: z.enum(['plumbing', 'electrical', 'hvac', 'roofing', 'church']),

  vertical_plumbing: VerticalPlumbingSchema.default({}),
  vertical_electrical: VerticalElectricalSchema.default({}),
  vertical_hvac: VerticalHvacSchema.default({}),
  vertical_roofing: VerticalRoofingSchema.default({}),
  vertical_church: VerticalChurchSchema.default({}),

  seo: SeoSchema.default({}),

  // Change request support — written by the portal, consumed by the
  // generation orchestrator. Cleared after each successful HTML generation.
  pendingChangeNote: z.string().nullable().default(null),
  changeHistory: z.array(ChangeHistoryEntrySchema).default([]),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types — single source of truth alongside the schemas.
// ---------------------------------------------------------------------------

export type Address = z.infer<typeof AddressSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Hours = z.infer<typeof HoursSchema>;
export type Emergency = z.infer<typeof EmergencySchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type Social = z.infer<typeof SocialSchema>;
export type Reputation = z.infer<typeof ReputationSchema>;
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type Business = z.infer<typeof BusinessSchema>;
export type VerticalPlumbing = z.infer<typeof VerticalPlumbingSchema>;
export type VerticalElectrical = z.infer<typeof VerticalElectricalSchema>;
export type VerticalHvac = z.infer<typeof VerticalHvacSchema>;
export type VerticalRoofing = z.infer<typeof VerticalRoofingSchema>;
export type VerticalChurch = z.infer<typeof VerticalChurchSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type Billing = z.infer<typeof BillingSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type ChangeHistoryEntry = z.infer<typeof ChangeHistoryEntrySchema>;
export type ContentJson = z.infer<typeof ContentSchema>;
