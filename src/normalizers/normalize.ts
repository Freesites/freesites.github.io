// ---------------------------------------------------------------------------
// Normalization helpers — called by the defaults factory before writing to
// content.json. These functions are deterministic, side-effect-free, and
// safe to call with null / undefined inputs.
// ---------------------------------------------------------------------------

/**
 * Trims and collapses internal whitespace to a single space.
 * Returns '' for null / undefined.
 */
export function normalizeString(input: string | null | undefined): string {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Formats a US phone number as "(NXX) NXX-XXXX".
 * Accepts digits-only strings, formatted strings, or strings with
 * a leading 1 country code. Returns the trimmed input unchanged if
 * it cannot be parsed as a 10- or 11-digit US number.
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return input.trim();
}

/**
 * Lowercases and trims an email address.
 * Returns '' for null / undefined.
 */
export function normalizeEmail(input: string | null | undefined): string {
  if (!input) return '';
  return input.trim().toLowerCase();
}

/**
 * Ensures a URL has an https:// scheme.
 * Returns null for empty / null / undefined input so callers can store null
 * cleanly rather than an empty string.
 */
export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Deduplicates, trims, filters blanks, and sorts a service-areas array.
 * Sorting is alphabetical so the stored value is deterministic regardless
 * of the order the contractor entered areas in the form.
 */
export function normalizeServiceAreas(areas: string[] | null | undefined): string[] {
  if (!areas || areas.length === 0) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const area of areas) {
    const normalized = normalizeString(area);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result.sort();
}
