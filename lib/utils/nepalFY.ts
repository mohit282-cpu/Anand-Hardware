/**
 * Nepal Financial Year & Date Utility
 *
 * Nepal's Fiscal Year begins on Shrawan 1 (mid-July, ~July 16/17 Gregorian)
 * and ends on Ashadh end (mid-July, ~July 15/16 Gregorian).
 *
 * Example:
 * Date in July 16, 2025 – July 15, 2026 => Nepal BS Year 2082 => FY 2082/83 (Sequence Key: 2082-83)
 * Date in July 16, 2026 – July 15, 2027 => Nepal BS Year 2083 => FY 2083/84 (Sequence Key: 2083-84)
 */

export interface NepalFYInfo {
  fyString: string; // e.g. "2082/83"
  fyKey: string;    // e.g. "2082-83"
  bsStartYear: number; // e.g. 2082
  bsEndYear: number;   // e.g. 2083
}

/**
 * Returns Nepal Financial Year info for a given Date (defaults to now).
 */
export function getNepalFY(date: Date = new Date()): NepalFYInfo {
  const gYear = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 6 = July
  const day = date.getDate();

  // Approximate BS conversion offset (+56.7 years)
  // If date is before ~July 16, it belongs to the previous BS fiscal year.
  // Shrawan 1 typically falls on July 16 or 17.
  let isShrawanOrLater = false;
  if (month > 6) {
    // August - December
    isShrawanOrLater = true;
  } else if (month === 6) {
    // July
    isShrawanOrLater = day >= 16;
  } else {
    // January - June
    isShrawanOrLater = false;
  }

  // Calculate BS starting year for FY
  // E.g., July 16, 2025 -> gYear 2025 -> BS Start Year 2025 + 57 = 2082
  // E.g., May 10, 2026 -> gYear 2026, before July -> belongs to BS 2082 (2026 + 56 = 2082)
  const bsStartYear = isShrawanOrLater ? gYear + 57 : gYear + 56;
  const bsEndYear = bsStartYear + 1;

  const shortEnd = String(bsEndYear).slice(-2);
  const fyString = `${bsStartYear}/${shortEnd}`;
  const fyKey = `${bsStartYear}-${shortEnd}`;

  return {
    fyString,
    fyKey,
    bsStartYear,
    bsEndYear,
  };
}

/**
 * Formats a document sequence number with financial year prefix.
 * Example: formatDocumentNumber('QT', '2082/83', 5) => 'QT-2082/83-005'
 */
export function formatDocumentNumber(prefix: string, fyString: string, seqNumber: number): string {
  const padded = String(seqNumber).padStart(3, '0');
  return `${prefix}-${fyString}-${padded}`;
}

/**
 * Returns a list of available Nepal Financial Years for reporting dropdowns.
 * Includes past 3 years, current year, and next year.
 */
export function getAvailableFinancialYears(): string[] {
  const current = getNepalFY();
  const baseBS = current.bsStartYear;

  const years: string[] = [];
  for (let i = -2; i <= 2; i++) {
    const start = baseBS + i;
    const endShort = String(start + 1).slice(-2);
    years.push(`${start}/${endShort}`);
  }

  return years;
}
