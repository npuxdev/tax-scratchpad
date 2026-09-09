import type { Cents, FilingStatus } from "../types";
import type { OrdinaryBracket } from "./constants";
import { ORDINARY_BRACKETS } from "./constants";
import { money } from "../money";
import table from "./tax-table.json" with { type: "json" };

export interface TaxTableRow {
  atLeast: number;
  lessThan: number;
  single: number;
  marriedJoint: number;
  marriedSeparate: number;
  headOfHousehold: number;
}

const TAX_TABLE = table as TaxTableRow[];

const STATUS_KEY: Record<
  FilingStatus,
  keyof Pick<
    TaxTableRow,
    "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold"
  >
> = {
  single: "single",
  married_joint: "marriedJoint",
  married_separate: "marriedSeparate",
  head_of_household: "headOfHousehold",
};

/**
 * Look up the 2025 Tax Table.
 * `taxableIncomeDollars` is whole dollars (Form 1040 line 15 style).
 * Finds the row where atLeast ≤ income < lessThan and returns tax in whole dollars.
 */
export function lookupTaxTable(
  taxableIncomeDollars: number,
  filingStatus: FilingStatus,
): number {
  if (taxableIncomeDollars < 0) return 0;
  if (taxableIncomeDollars >= 100_000) {
    throw new RangeError(
      "lookupTaxTable is only valid for taxable income under $100,000; use computeTaxFromBrackets",
    );
  }

  // Rows are contiguous $50 bands starting at 0.
  const index = Math.floor(taxableIncomeDollars / 50);
  const row = TAX_TABLE[index];
  if (!row || taxableIncomeDollars < row.atLeast || taxableIncomeDollars >= row.lessThan) {
    const found = TAX_TABLE.find(
      (r) => taxableIncomeDollars >= r.atLeast && taxableIncomeDollars < r.lessThan,
    );
    if (!found) {
      throw new RangeError(
        `No tax table row for taxable income ${taxableIncomeDollars}`,
      );
    }
    return found[STATUS_KEY[filingStatus]];
  }
  return row[STATUS_KEY[filingStatus]];
}

/**
 * Tax Computation Worksheet path: apply ordinary brackets to taxable income in cents.
 * Result is IRS-rounded to whole dollars (multiple of 100 cents).
 */
export function computeTaxFromBrackets(
  taxableIncomeCents: Cents,
  brackets: readonly OrdinaryBracket[],
): Cents {
  if (taxableIncomeCents <= 0) return money.zero;

  let taxExact = 0;
  for (const bracket of brackets) {
    if (taxableIncomeCents <= bracket.from) break;
    const upper = bracket.to ?? Number.POSITIVE_INFINITY;
    const slice = Math.min(taxableIncomeCents, upper) - bracket.from;
    if (slice > 0) {
      taxExact += slice * bracket.rate;
    }
  }

  // Bracket math is in cents×rate → fractional cents; round to nearest cent, then IRS whole dollars.
  return money.roundIRS(money.roundNearestCent(taxExact));
}

export function getBracketsForStatus(
  filingStatus: FilingStatus,
): readonly OrdinaryBracket[] {
  return ORDINARY_BRACKETS[filingStatus];
}

export { TAX_TABLE };
