import type { Cents, FilingStatus } from "../types";
import { money } from "../money";
import { TAX_TABLE_MAX_EXCLUSIVE, getOrdinaryBrackets } from "./constants";
import {
  computeTaxFromBrackets,
  lookupTaxTable,
} from "./tax-table";

export type OrdinaryTaxMethod = "tax-table" | "computation-worksheet";

export interface OrdinaryTaxTrace {
  taxableIncomeCents: Cents;
  taxableIncomeDollars: number;
  filingStatus: FilingStatus;
  method: OrdinaryTaxMethod;
  /** Whole-dollar tax from table lookup (when method is tax-table). */
  tableTaxDollars?: number;
  /** Detail for worksheet path. */
  worksheet?: {
    bracketsApplied: Array<{
      from: Cents;
      to: Cents | null;
      rate: number;
      sliceCents: Cents;
      taxCentsExact: number;
    }>;
  };
}

export interface OrdinaryTaxResult {
  tax: Cents;
  method: OrdinaryTaxMethod;
  trace: OrdinaryTaxTrace;
}

/**
 * Compute 2025 ordinary income tax on taxable income.
 * - Under $100,000: IRS Tax Table (midpoint method precomputed)
 * - $100,000+: Tax Computation Worksheet via continuous brackets
 *
 * Taxable income is expected as IRS whole-dollar cents (multiple of 100).
 */
export function computeOrdinaryTax(
  taxableIncomeCents: Cents,
  filingStatus: FilingStatus,
): OrdinaryTaxResult {
  const wholeDollarCents = money.roundIRS(taxableIncomeCents);
  const taxableIncomeDollars = wholeDollarCents / 100;

  if (wholeDollarCents < TAX_TABLE_MAX_EXCLUSIVE) {
    const tableTaxDollars = lookupTaxTable(taxableIncomeDollars, filingStatus);
    const tax = money.fromDollars(tableTaxDollars);
    return {
      tax,
      method: "tax-table",
      trace: {
        taxableIncomeCents: wholeDollarCents,
        taxableIncomeDollars,
        filingStatus,
        method: "tax-table",
        tableTaxDollars,
      },
    };
  }

  const brackets = getOrdinaryBrackets(filingStatus);
  const worksheetSlices: NonNullable<OrdinaryTaxTrace["worksheet"]>["bracketsApplied"] =
    [];

  let taxExact = 0;
  for (const bracket of brackets) {
    if (wholeDollarCents <= bracket.from) break;
    const upper = bracket.to ?? Number.POSITIVE_INFINITY;
    const sliceCents = Math.max(
      0,
      Math.min(wholeDollarCents, upper) - bracket.from,
    );
    if (sliceCents <= 0) continue;
    const taxCentsExact = sliceCents * bracket.rate;
    taxExact += taxCentsExact;
    worksheetSlices.push({
      from: bracket.from,
      to: bracket.to,
      rate: bracket.rate,
      sliceCents,
      taxCentsExact,
    });
  }

  const tax = money.roundIRS(money.roundNearestCent(taxExact));

  return {
    tax,
    method: "computation-worksheet",
    trace: {
      taxableIncomeCents: wholeDollarCents,
      taxableIncomeDollars,
      filingStatus,
      method: "computation-worksheet",
      worksheet: { bracketsApplied: worksheetSlices },
    },
  };
}

export { computeTaxFromBrackets, lookupTaxTable };
