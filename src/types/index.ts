// ---------------------------------------------------------------------------
// Central type re-exports — import from here instead of individual schema
// files when you only need types (not the Zod validators).
// ---------------------------------------------------------------------------

export type {
  Address,
  Service,
  Hours,
  Emergency,
  Booking,
  Credentials,
  Social,
  Reputation,
  Testimonial,
  Photo,
  Business,
  VerticalPlumbing,
  VerticalElectrical,
  VerticalHvac,
  Seo,
  ContentJson,
} from '../schemas/content.schema';

export type {
  IntakeFormData,
  BiggestChallenge,
} from '../schemas/intake.schema';

export type {
  PromptPayload,
} from '../schemas/prompt-payload.schema';

export type {
  ContentPatch,
  ChangeRequest,
} from '../schemas/change-request.schema';
