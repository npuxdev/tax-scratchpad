import type { Cents, FilingStatus, SourceAuthority } from "../types";

export const TAX_YEAR = 2025 as const;
export const RULE_SET = "federal-2025-v1" as const;

/** Bracket: taxable income in [from, to) at `rate`. Top bracket uses to = null. */
export interface OrdinaryBracket {
  from: Cents;
  to: Cents | null;
  rate: number;
}

// Source: Rev. Proc. 2024-40 (inflation adjustments for 2025)
export const SOURCE_STANDARD_DEDUCTION: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Rev. Proc. 2024-40",
  section: "Standard Deduction",
};

export const SOURCE_ORDINARY_BRACKETS: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Rev. Proc. 2024-40",
  section: "Tax Rate Tables",
};

export const SOURCE_SE_TAX: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Schedule SE (Form 1040) Instructions",
  section: "Self-Employment Tax",
};

export const SOURCE_SS_WAGE_BASE: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Social Security Administration / Rev. Proc. 2024-40",
  section: "Contribution and Benefit Base",
};

export const SOURCE_CTC: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Schedule 8812 (Form 1040) Instructions",
  section: "Child Tax Credit / Additional Child Tax Credit / Other Dependent Credit",
};

export const SOURCE_SALT: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Schedule A (Form 1040) Instructions / OBBBA salt cap rules",
  section: "State and Local Taxes",
};

export const SOURCE_MEDICAL: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Schedule A (Form 1040) Instructions",
  section: "Medical and Dental Expenses",
};

export const SOURCE_BUSINESS_MEALS: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Schedule C (Form 1040) Instructions / IRC §274",
  section: "Meals",
};

export const SOURCE_QD_BRACKETS: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Rev. Proc. 2024-40",
  section: "Qualified Dividends and Capital Gain Tax Worksheets — rate thresholds",
};

export const SOURCE_ADDITIONAL_MEDICARE: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "Form 8959 Instructions",
  section: "Additional Medicare Tax",
};

export const SOURCE_TAX_TABLE: SourceAuthority = {
  authority: "IRS",
  taxYear: 2025,
  document: "2025 Form 1040 Instructions — Tax Table / Tax Computation Worksheet",
};

/** Base standard deduction amounts in cents. */
export const STANDARD_DEDUCTION = {
  single: 1_575_000, // $15,750
  married_separate: 1_575_000, // $15,750
  married_joint: 3_150_000, // $31,500
  head_of_household: 2_362_500, // $23,625
} as const satisfies Record<FilingStatus, Cents>;

/**
 * 2025 ordinary income tax brackets in cents.
 * Upper bound is exclusive; `to: null` means no upper bound.
 */
export const ORDINARY_BRACKETS: Record<FilingStatus, readonly OrdinaryBracket[]> =
  {
    single: [
      { from: 0, to: 1_192_500, rate: 0.1 }, // $0–$11,925
      { from: 1_192_500, to: 4_847_500, rate: 0.12 }, // $11,925–$48,475
      { from: 4_847_500, to: 10_335_000, rate: 0.22 }, // $48,475–$103,350
      { from: 10_335_000, to: 19_730_000, rate: 0.24 }, // $103,350–$197,300
      { from: 19_730_000, to: 25_052_500, rate: 0.32 }, // $197,300–$250,525
      { from: 25_052_500, to: 62_635_000, rate: 0.35 }, // $250,525–$626,350
      { from: 62_635_000, to: null, rate: 0.37 }, // $626,350+
    ],
    married_joint: [
      { from: 0, to: 2_385_000, rate: 0.1 }, // $0–$23,850
      { from: 2_385_000, to: 9_695_000, rate: 0.12 }, // $23,850–$96,950
      { from: 9_695_000, to: 20_670_000, rate: 0.22 }, // $96,950–$206,700
      { from: 20_670_000, to: 39_460_000, rate: 0.24 }, // $206,700–$394,600
      { from: 39_460_000, to: 50_105_000, rate: 0.32 }, // $394,600–$501,050
      { from: 50_105_000, to: 75_160_000, rate: 0.35 }, // $501,050–$751,600
      { from: 75_160_000, to: null, rate: 0.37 }, // $751,600+
    ],
    married_separate: [
      { from: 0, to: 1_192_500, rate: 0.1 }, // $0–$11,925
      { from: 1_192_500, to: 4_847_500, rate: 0.12 }, // $11,925–$48,475
      { from: 4_847_500, to: 10_335_000, rate: 0.22 }, // $48,475–$103,350
      { from: 10_335_000, to: 19_730_000, rate: 0.24 }, // $103,350–$197,300
      { from: 19_730_000, to: 25_052_500, rate: 0.32 }, // $197,300–$250,525
      { from: 25_052_500, to: 37_580_000, rate: 0.35 }, // $250,525–$375,800
      { from: 37_580_000, to: null, rate: 0.37 }, // $375,800+
    ],
    head_of_household: [
      { from: 0, to: 1_700_000, rate: 0.1 }, // $0–$17,000
      { from: 1_700_000, to: 6_485_000, rate: 0.12 }, // $17,000–$64,850
      { from: 6_485_000, to: 10_335_000, rate: 0.22 }, // $64,850–$103,350
      { from: 10_335_000, to: 19_730_000, rate: 0.24 }, // $103,350–$197,300
      { from: 19_730_000, to: 25_050_000, rate: 0.32 }, // $197,300–$250,500
      { from: 25_050_000, to: 62_635_000, rate: 0.35 }, // $250,500–$626,350
      { from: 62_635_000, to: null, rate: 0.37 }, // $626,350+
    ],
  };

/** Social Security wage base for 2025: $176,100. */
export const SS_WAGE_BASE: Cents = 17_610_000;

export const SE_RATE_SS = 0.124;
export const SE_RATE_MEDICARE = 0.029;
export const SE_NET_EARNINGS_FACTOR = 0.9235;
/** SE tax applies when net earnings ≥ $400. */
export const SE_TAX_THRESHOLD: Cents = 40_000;

/** Child Tax Credit maximum per qualifying child: $2,200. */
export const CTC_MAX: Cents = 220_000;
/** Additional Child Tax Credit refundable maximum: $1,700. */
export const ACTC_MAX: Cents = 170_000;
/** Credit for Other Dependents: $500. */
export const ODC_MAX: Cents = 50_000;
export const CTC_PHASEOUT_MFJ: Cents = 40_000_000; // $400,000
export const CTC_PHASEOUT_OTHER: Cents = 20_000_000; // $200,000
export const ACTC_EARNED_INCOME_FLOOR: Cents = 250_000; // $2,500

/** SALT deduction cap / floor / phaseout (cents). */
export const SALT_CAP = {
  default: 4_000_000, // $40,000
  married_separate: 2_000_000, // $20,000
} as const;

export const SALT_FLOOR = {
  default: 1_000_000, // $10,000
  married_separate: 500_000, // $5,000
} as const;

export const SALT_PHASEOUT_THRESHOLD = {
  default: 50_000_000, // $500,000
  married_separate: 25_000_000, // $250,000
} as const;

export const SALT_PHASEOUT_RATE = 0.3;

export const MEDICAL_FLOOR_RATE = 0.075;
export const BUSINESS_MEALS_DEDUCTIBLE_RATE = 0.5;

/**
 * Qualified dividend / long-term capital gain rate thresholds (taxable income).
 * `rate15Starts` = first dollar taxed at 15%; `rate20Starts` = first dollar at 20%.
 */
export const QD_THRESHOLDS: Record<
  FilingStatus,
  { rate15Starts: Cents; rate20Starts: Cents }
> = {
  single: {
    rate15Starts: 4_835_000, // $48,350
    rate20Starts: 53_340_000, // $533,400
  },
  married_joint: {
    rate15Starts: 9_670_000, // $96,700
    rate20Starts: 60_005_000, // $600,050
  },
  married_separate: {
    rate15Starts: 4_835_000, // half of MFJ
    rate20Starts: 30_002_500, // half of MFJ
  },
  head_of_household: {
    rate15Starts: 6_475_000, // $64,750
    rate20Starts: 56_670_000, // $566,700
  },
};

/** Additional Medicare Tax (Form 8959) thresholds and rate. */
export const ADDITIONAL_MEDICARE_THRESHOLD: Record<FilingStatus, Cents> = {
  single: 20_000_000, // $200,000
  head_of_household: 20_000_000, // $200,000
  married_joint: 25_000_000, // $250,000
  married_separate: 12_500_000, // $125,000
};

export const ADDITIONAL_MEDICARE_RATE = 0.009;

/** Taxable income below this uses the Tax Table; at/above uses the Tax Computation Worksheet. */
export const TAX_TABLE_MAX_EXCLUSIVE: Cents = 10_000_000; // $100,000

export function getStandardDeduction(status: FilingStatus): Cents {
  return STANDARD_DEDUCTION[status];
}

export function getOrdinaryBrackets(
  status: FilingStatus,
): readonly OrdinaryBracket[] {
  return ORDINARY_BRACKETS[status];
}
