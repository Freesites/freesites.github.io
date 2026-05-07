import type { ContentJson } from '../schemas/content.schema';
import type { PromptPayload } from '../schemas/prompt-payload.schema';

// ---------------------------------------------------------------------------
// mapContentToPromptPayload — transforms the canonical nested ContentJson
// into the flat object embedded as {{CONTENT_JSON}} in prompt templates.
//
// This function is the single place where the stored schema shape is
// translated into what Claude expects. If a prompt template changes its
// field references, update the mapping here — never reshape the stored schema.
//
// Key decisions applied:
//   - emergencyPhone: emergency.emergencyPhone is canonical; falls back to
//     business.emergencyPhone for records created before that field moved.
//   - showFounderBadge: both isFounderMember AND founderBadgeEnabled must
//     be true. isFounderMember is immutable; founderBadgeEnabled is the
//     display toggle.
//   - Only the active vertical's sub-object is included. The other two
//     vertical fields are omitted so Claude cannot accidentally reference
//     data that does not apply to this client.
//   - Internal metadata (schemaVersion, createdAt, siteVersion, etc.) is
//     excluded — it has no role in site generation.
// ---------------------------------------------------------------------------

export function mapContentToPromptPayload(content: ContentJson): PromptPayload {
  const { business, emergency, booking, credentials, reputation } = content;

  const emergencyPhone = emergency.emergencyPhone || business.emergencyPhone;
  const showFounderBadge = content.isFounderMember && content.founderBadgeEnabled;

  const base = {
    siteId: content.siteId,
    biggestChallenge: content.biggestChallenge,
    showFounderBadge,
    planTier: content.planTier,
    pendingChangeNote: content.pendingChangeNote,

    businessName: business.name,
    tagline: business.tagline,
    phone: business.phone,
    email: business.email,
    ownerName: business.ownerName,
    yearsInBusiness: business.yearsInBusiness,
    logoUrl: business.logoUrl,

    city: business.address.city,
    state: business.address.state,
    street: business.address.street,
    zip: business.address.zip,
    serviceAreas: business.serviceAreas,

    emergency24x7: emergency.emergency24x7,
    emergencyPhone,
    emergencyResponseTime: emergency.emergencyResponseTime,

    bookingUrl: booking.bookingUrl,
    callToBookEnabled: booking.callToBookEnabled,
    textCommunicationNumber: booking.textCommunicationNumber,

    licenseNumber: credentials.licenseNumber,
    insuranceVerified: credentials.insuranceVerified,
    certifications: credentials.certifications,

    googleRating: reputation.googleRating,
    reviewCount: reputation.reviewCount,

    services: content.services,
    hours: content.hours,
    hoursNote: content.hours.hoursNote,
    testimonials: content.testimonials,
    photos: content.photos,
    social: content.social,
    seo: content.seo,
  };

  switch (content.verticalType) {
    case 'plumbing':
      return {
        ...base,
        verticalType: 'plumbing',
        vertical_plumbing: content.vertical_plumbing,
      };
    case 'electrical':
      return {
        ...base,
        verticalType: 'electrical',
        vertical_electrical: content.vertical_electrical,
      };
    case 'hvac':
      return {
        ...base,
        verticalType: 'hvac',
        vertical_hvac: content.vertical_hvac,
      };
    case 'roofing':
      return {
        ...base,
        verticalType: 'roofing',
        vertical_roofing: content.vertical_roofing,
      };
    case 'church':
      return {
        ...base,
        verticalType: 'church',
        vertical_church: content.vertical_church,
      };
  }
}
