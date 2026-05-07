import { randomUUID } from 'node:crypto';
import type { ContentJson } from '../schemas/content.schema';
import type { IntakeFormData } from '../schemas/intake.schema';
import {
  normalizeString,
  normalizePhone,
  normalizeEmail,
  normalizeUrl,
  normalizeServiceAreas,
} from '../normalizers/normalize';

// ---------------------------------------------------------------------------
// buildDefaultContent — converts a validated intake form submission into a
// fully-shaped ContentJson record ready to be stored in Netlify Blobs.
//
// Rules:
//   - Every field in ContentJson must be populated (no undefined).
//   - Fields not captured by the intake form get safe empty defaults.
//   - Normalization (phone formatting, URL scheme, etc.) happens here.
//   - business.emergencyPhone is always '' — canonical location is
//     emergency.emergencyPhone.
//   - hours.emergencyService mirrors emergency.emergency24x7 so both
//     are always in sync from the moment a record is created.
//   - founderBadgeEnabled defaults to isFounderMember so founding
//     members get the badge by default; it can be toggled later via
//     a change request.
//   - isBetaClient records start as activationStatus 'active' with
//     billing.planActivated = true — they skip Stripe entirely.
//   - Standard records start as 'draft'; the intake handler moves them
//     to 'pending_payment' after a Stripe checkout session is created.
// ---------------------------------------------------------------------------

export function buildDefaultContent(intake: IntakeFormData): ContentJson {
  const now = new Date().toISOString();
  const emergency24x7 = intake.emergency24x7 ?? false;
  const isBeta = intake.isBetaClient ?? false;

  return {
    schemaVersion: '1.0',
    siteId: randomUUID(),
    createdAt: now,
    lastUpdated: now,
    siteVersion: 1,
    planTier: intake.planTier ?? 'founding',
    isFounderMember: intake.isFounderMember ?? false,
    isBetaClient: isBeta,
    founderBadgeEnabled: intake.isFounderMember ?? false,
    domainStatus: 'preview',
    activationStatus: isBeta ? 'active' : 'draft',
    deploymentStatus: 'idle',
    biggestChallenge: intake.biggestChallenge,
    billing: {
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
      stripeCustomerId: null,
      activatedAt: isBeta ? now : null,
      planActivated: isBeta,
    },
    deployment: {
      runId: null,
      lockAcquiredAt: null,
      netlifySiteId: null,
      netlifyDeployId: null,
      deployedUrl: null,
      deployedAt: null,
      lastGeneratedAt: null,
      failureReason: null,
      healthCheckPassed: null,
      successEmailSentAt: null,
      failureEmailSentAt: null,
    },

    business: {
      name: normalizeString(intake.businessName),
      tagline: normalizeString(intake.tagline),
      phone: normalizePhone(intake.phone),
      emergencyPhone: '',
      email: normalizeEmail(intake.email),
      address: {
        street: normalizeString(intake.street),
        city: normalizeString(intake.city),
        state: normalizeString(intake.state),
        zip: normalizeString(intake.zip),
      },
      serviceAreas: normalizeServiceAreas(intake.serviceAreas),
      ownerName: normalizeString(intake.ownerName),
      yearsInBusiness: intake.yearsInBusiness ?? null,
      logoUrl: null,
    },

    services: (intake.services ?? []).map(s => ({
      name: normalizeString(s.name),
      description: normalizeString(s.description),
      featured: s.featured,
    })),

    hours: {
      mon: '',
      tue: '',
      wed: '',
      thu: '',
      fri: '',
      sat: '',
      sun: '',
      emergencyService: emergency24x7,
      hoursNote: normalizeString(intake.hoursText),
    },

    emergency: {
      emergency24x7,
      emergencyPhone: normalizePhone(intake.emergencyPhone),
      emergencyResponseTime: normalizeString(intake.emergencyResponseTime),
    },

    booking: {
      bookingUrl: normalizeUrl(intake.bookingUrl),
      callToBookEnabled: false,
      textCommunicationNumber: null,
    },

    credentials: {
      licenseNumber: normalizeString(intake.licenseNumber),
      insuranceVerified: intake.insuranceVerified ?? false,
      certifications: [],
    },

    social: {
      facebook: normalizeUrl(intake.facebookUrl) ?? null,
      google: normalizeUrl(intake.googleProfileUrl) ?? null,
      yelp: null,
      nextdoor: null,
      thumbtack: normalizeUrl(intake.thumbtackUrl) ?? null,
    },

    reputation: {
      googleRating: intake.googleRating ?? null,
      reviewCount: intake.reviewCount ?? null,
      featuredReviews: [],
    },

    testimonials: [],
    photos: [],

    verticalType: intake.verticalType,

    vertical_plumbing: {
      drainSpecialty: false,
      waterHeaterBrands: [],
      emergencyRepair: false,
      sumpPump: false,
    },

    vertical_electrical: {
      panelUpgrade: false,
      evCharging: false,
      generatorInstall: false,
      commercialService: false,
    },

    vertical_hvac: {
      brandsServiced: [],
      maintenancePlans: false,
      financingAvailable: false,
      seasonalServices: [],
    },

    vertical_roofing: {
      residentialRoofing: false,
      commercialRoofing: false,
      roofingMaterials: [],
      stormDamageRepair: false,
      freeInspection: false,
      insuranceClaims: false,
    },

    vertical_church: {
      denomination: null,
      weeklyServices: null,
      communityPrograms: [],
      streamingAvailable: false,
      youthPrograms: false,
    },

    seo: {
      metaTitle: null,
      metaDescription: null,
      lastOptimized: null,
    },

    pendingChangeNote: null,
    changeHistory: [],
  };
}
