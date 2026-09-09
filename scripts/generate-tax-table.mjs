#!/usr/bin/env node
/**
 * Generate IRS-style Tax Table rows for TY 2025.
 *
 * For each $50 range [atLeast, lessThan) from $0 to $100,000:
 * - Midpoint = (atLeast + lessThan) / 2  (e.g. 25300–25350 → 25325)
 * - Compute continuous bracket tax on the midpoint
 * - Round to nearest whole dollar
 *
 * Output: src/tax/2025/tax-table.json (amounts in whole dollars)
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Brackets in whole dollars: [from, to) at rate. to = Infinity for top. */
const BRACKETS = {
  single: [
    [0, 11925, 0.1],
    [11925, 48475, 0.12],
    [48475, 103350, 0.22],
    [103350, 197300, 0.24],
    [197300, 250525, 0.32],
    [250525, 626350, 0.35],
    [626350, Infinity, 0.37],
  ],
  marriedJoint: [
    [0, 23850, 0.1],
    [23850, 96950, 0.12],
    [96950, 206700, 0.22],
    [206700, 394600, 0.24],
    [394600, 501050, 0.32],
    [501050, 751600, 0.35],
    [751600, Infinity, 0.37],
  ],
  marriedSeparate: [
    [0, 11925, 0.1],
    [11925, 48475, 0.12],
    [48475, 103350, 0.22],
    [103350, 197300, 0.24],
    [197300, 250525, 0.32],
    [250525, 375800, 0.35],
    [375800, Infinity, 0.37],
  ],
  headOfHousehold: [
    [0, 17000, 0.1],
    [17000, 64850, 0.12],
    [64850, 103350, 0.22],
    [103350, 197300, 0.24],
    [197300, 250500, 0.32],
    [250500, 626350, 0.35],
    [626350, Infinity, 0.37],
  ],
};

function taxOnMidpoint(income, brackets) {
  let tax = 0;
  for (const [from, to, rate] of brackets) {
    if (income <= from) break;
    const slice = Math.min(income, to) - from;
    if (slice > 0) tax += slice * rate;
  }
  // Nearest whole dollar (IRS table style for positive amounts)
  return Math.round(tax);
}

const RANGE = 50;
const MAX = 100_000;
const rows = [];

for (let atLeast = 0; atLeast < MAX; atLeast += RANGE) {
  const lessThan = atLeast + RANGE;
  const midpoint = (atLeast + lessThan) / 2;
  rows.push({
    atLeast,
    lessThan,
    single: taxOnMidpoint(midpoint, BRACKETS.single),
    marriedJoint: taxOnMidpoint(midpoint, BRACKETS.marriedJoint),
    marriedSeparate: taxOnMidpoint(midpoint, BRACKETS.marriedSeparate),
    headOfHousehold: taxOnMidpoint(midpoint, BRACKETS.headOfHousehold),
  });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "src", "tax", "2025", "tax-table.json");
writeFileSync(outPath, `${JSON.stringify(rows)}\n`);

const sample = rows.find((r) => r.atLeast === 25300);
console.log(`Wrote ${rows.length} rows to ${outPath}`);
console.log(
  `Verify MFJ 25300–25350: midpoint tax = ${sample?.marriedJoint} (expected 2562)`,
);
if (sample?.marriedJoint !== 2562) {
  console.error("VERIFICATION FAILED");
  process.exit(1);
}
console.log("Verification OK");
