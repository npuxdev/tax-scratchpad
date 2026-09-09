/**
 * Monetary values as integer cents.
 *
 * IRS whole-dollar rounding (Pub 17 / Form 1040 instructions):
 * Drop amounts under 50 cents; increase amounts from 50 to 99 cents to the next dollar.
 * For cents `c`, whole-dollar cents = Math.floor((c + 50) / 100) * 100
 * (e.g. 149 → $1.49 → $1 = 100; 150 → $1.50 → $2 = 200).
 */

export type Cents = number;

function assertFinite(n: number, label: string): void {
  if (!Number.isFinite(n)) {
    throw new RangeError(`${label} must be a finite number`);
  }
}

export const money = {
  fromDollars(dollars: number): Cents {
    assertFinite(dollars, "dollars");
    return Math.round(dollars * 100);
  },

  toDollars(cents: Cents): number {
    return cents / 100;
  },

  add(...amounts: Cents[]): Cents {
    let sum = 0;
    for (const a of amounts) sum += a;
    return sum;
  },

  subtract(a: Cents, b: Cents): Cents {
    return a - b;
  },

  /**
   * Multiply a cent amount by a rate and round to the nearest cent.
   * Uses `Math.round(cents * rate)` so the intermediate product may be floating-point;
   * the result is always an integer cent value.
   */
  multiplyRate(cents: Cents, rate: number): Cents {
    assertFinite(rate, "rate");
    return Math.round(cents * rate);
  },

  /**
   * Round to the nearest whole dollar (multiple of 100 cents) using the IRS rule:
   * under 50¢ drops; 50–99¢ rounds up.
   * Equivalent to `Math.floor((cents + 50) / 100) * 100` for non-negative amounts.
   * Negative amounts round symmetrically (away from zero at exactly .50).
   */
  roundIRS(cents: Cents): Cents {
    if (cents >= 0) {
      return Math.floor((cents + 50) / 100) * 100;
    }
    return -Math.floor((-cents + 50) / 100) * 100;
  },

  /** Round a floating-point cent quantity to the nearest integer cent. */
  roundNearestCent(n: number): Cents {
    assertFinite(n, "value");
    return Math.round(n);
  },

  /**
   * Format as whole dollars for tax-amount display: "$1,234".
   * When `signed` is true, positive amounts get a leading "+".
   */
  format(cents: Cents, opts?: { signed?: boolean }): string {
    const dollars = money.roundIRS(cents) / 100;
    const abs = Math.abs(dollars);
    const body = `$${abs.toLocaleString("en-US", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })}`;
    if (dollars < 0) return `-${body}`;
    if (opts?.signed && dollars > 0) return `+${body}`;
    if (opts?.signed && dollars === 0) return body;
    return body;
  },

  /** Format with cents: "$1,234.56". */
  formatExact(cents: Cents): string {
    const dollars = cents / 100;
    const negative = dollars < 0;
    const abs = Math.abs(dollars);
    const body = `$${abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return negative ? `-${body}` : body;
  },

  /**
   * Parse user money input to cents.
   * Accepts "$1,234.56", "1234.56", "(1,234.56)", "-12.3", etc.
   */
  parse(input: string): Cents | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    let s = trimmed;
    let negative = false;

    if (s.startsWith("(") && s.endsWith(")")) {
      negative = true;
      s = s.slice(1, -1).trim();
    }

    s = s.replace(/\$/g, "").replace(/,/g, "").trim();

    if (s.startsWith("-")) {
      negative = !negative;
      s = s.slice(1).trim();
    } else if (s.startsWith("+")) {
      s = s.slice(1).trim();
    }

    if (!/^\d+(\.\d{1,2})?$/.test(s) && !/^\.\d{1,2}$/.test(s)) {
      // Allow trailing extra precision by rejecting; also reject empty
      if (!/^\d+(\.\d+)?$/.test(s) && !/^\.\d+$/.test(s)) return null;
    }

    const n = Number(s);
    if (!Number.isFinite(n)) return null;

    const cents = Math.round(n * 100);
    return negative ? -cents : cents;
  },

  max(a: Cents, b: Cents): Cents {
    return a >= b ? a : b;
  },

  min(a: Cents, b: Cents): Cents {
    return a <= b ? a : b;
  },

  abs(a: Cents): Cents {
    return a < 0 ? -a : a;
  },

  isNegative(a: Cents): boolean {
    return a < 0;
  },

  zero: 0 as Cents,
};
