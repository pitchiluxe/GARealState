import type { Course } from "@/types";

// ─── XP Level System ─────────────────────────────────────────────────────────

export const XP_LEVELS = [
  { level: 1,  title: "First-Timer",     minXp: 0,     color: "#9ca3af" },
  { level: 2,  title: "Curious Learner", minXp: 200,   color: "#60a5fa" },
  { level: 3,  title: "Studious",        minXp: 500,   color: "#34d399" },
  { level: 4,  title: "On Track",        minXp: 1000,  color: "#a78bfa" },
  { level: 5,  title: "License Ready",   minXp: 2000,  color: "#fbbf24" },
  { level: 6,  title: "Exam Prepped",    minXp: 3500,  color: "#f97316" },
  { level: 7,  title: "Sharp Agent",     minXp: 5500,  color: "#ef4444" },
  { level: 8,  title: "GA Pro",          minXp: 8000,  color: "#E8825A" },
  { level: 9,  title: "Peach State Pro", minXp: 11000, color: "#ec4899" },
  { level: 10, title: "RE Master",       minXp: 15000, color: "#8b5cf6" },
];

export function getXpProgress(totalXp: number): {
  level: (typeof XP_LEVELS)[number];
  nextLevel: (typeof XP_LEVELS)[number] | null;
  percent: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (totalXp >= lvl.minXp) current = lvl;
  }
  const idx = XP_LEVELS.indexOf(current);
  const next = XP_LEVELS[idx + 1] ?? null;
  if (!next) return { level: current, nextLevel: null, percent: 100, xpIntoLevel: 0, xpForNextLevel: 0 };
  const xpIntoLevel = totalXp - current.minXp;
  const xpForNextLevel = next.minXp - current.minXp;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));
  return { level: current, nextLevel: next, percent, xpIntoLevel, xpForNextLevel };
}

// pages → estimated minutes (2 min/page, min 10)
function mins(pages: number): number { return Math.max(10, pages * 2); }

// ─── Georgia Real Estate Pre-License Curriculum ───────────────────────────────

export const COURSES: Course[] = [
  // ── LEVEL 1 ───────────────────────────────────────────────────────────────
  {
    id: "level-01",
    title: "Level 1: Real Estate Foundations",
    description: "Core concepts of real estate — what it is, types of property, land characteristics, land rights, and estates. The essential vocabulary and theory for everything that follows.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "BEGINNER",
    totalModules: 7,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-01",
    modules: [
      { id: "l01-01", title: "Welcome to GA Real Estate Academy!", description: "Course overview, structure, and how to use the platform effectively.", estimatedMinutes: mins(14) },
      { id: "l01-02", title: "What Is Real Estate?", description: "Definition of real estate, land, improvements, and the real estate business.", estimatedMinutes: mins(44) },
      { id: "l01-03", title: "Types of Property", description: "Real property, personal property, and how property is classified.", estimatedMinutes: mins(16) },
      { id: "l01-04", title: "Real vs. Personal Property", description: "Fixtures, trade fixtures, and how to distinguish real from personal property.", estimatedMinutes: mins(44) },
      { id: "l01-05", title: "The Characteristics of Land", description: "Physical and economic characteristics — immobility, indestructibility, uniqueness, scarcity.", estimatedMinutes: mins(36) },
      { id: "l01-06", title: "Land Rights", description: "Surface rights, subsurface rights, air rights, and riparian/littoral water rights.", estimatedMinutes: mins(31) },
      { id: "l01-07", title: "Estates", description: "Freehold estates, leasehold estates, fee simple, life estates, and defeasible fees.", estimatedMinutes: mins(39) },
    ],
  },

  // ── LEVEL 2 ───────────────────────────────────────────────────────────────
  {
    id: "level-02",
    title: "Level 2: Real Property Ownership",
    description: "How real property is owned — individually, in business entities, as common interest, in investment groups, and through trusts.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "BEGINNER",
    totalModules: 5,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-02",
    modules: [
      { id: "l02-01", title: "Forms of Ownership", description: "Severalty, joint tenancy, tenancy in common, tenancy by the entireties, community property.", estimatedMinutes: mins(47) },
      { id: "l02-02", title: "Ownership as a Business", description: "General partnerships, limited partnerships, corporations, and LLCs as ownership vehicles.", estimatedMinutes: mins(35) },
      { id: "l02-03", title: "Common Interest Ownership Properties", description: "Condominiums, cooperatives, time-shares, and planned unit developments (PUDs).", estimatedMinutes: mins(52) },
      { id: "l02-04", title: "Group Real Estate Investment Forms", description: "REITs, real estate syndications, and real estate investment structures.", estimatedMinutes: mins(25) },
      { id: "l02-05", title: "Trusts as Ownership Vehicles", description: "Living trusts, land trusts, Illinois-type land trusts, and how trusts hold real property.", estimatedMinutes: mins(27) },
    ],
  },

  // ── LEVEL 3 ───────────────────────────────────────────────────────────────
  {
    id: "level-03",
    title: "Level 3: Legal Land Descriptions & Measuring Real Property",
    description: "How land is legally described and measured — metes and bounds, rectangular survey system, and area calculations.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "BEGINNER",
    totalModules: 3,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-03",
    modules: [
      { id: "l03-01", title: "Basic Legal Description Methods", description: "Metes and bounds, lot and block (plat) method, and how to read legal descriptions.", estimatedMinutes: mins(29) },
      { id: "l03-02", title: "Rectangular Survey System", description: "Principal meridians, base lines, townships, ranges, sections, and fractional sections.", estimatedMinutes: mins(32) },
      { id: "l03-03", title: "Measuring Real Property", description: "Area and volume calculations — square footage, acreage, and property measurement math.", estimatedMinutes: mins(49) },
    ],
  },

  // ── LEVEL 4 ───────────────────────────────────────────────────────────────
  {
    id: "level-04",
    title: "Level 4: Land Use Controls & Encumbrances",
    description: "Private and government controls on land use — zoning, deed restrictions, easements, and liens that can affect property ownership.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "BEGINNER",
    totalModules: 4,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-04",
    modules: [
      { id: "l04-01", title: "Private Land-Use Controls", description: "CC&Rs, deed restrictions, restrictive covenants, and how private parties limit land use.", estimatedMinutes: mins(26) },
      { id: "l04-02", title: "Encumbrances", description: "Types of encumbrances — liens, easements, encroachments — and their effect on title.", estimatedMinutes: mins(29) },
      { id: "l04-03", title: "Easements", description: "Easements appurtenant, easements in gross, creation methods, and termination of easements.", estimatedMinutes: mins(38) },
      { id: "l04-04", title: "Liens", description: "Voluntary vs. involuntary liens, mortgage liens, judgment liens, tax liens, mechanic's liens, and lien priority.", estimatedMinutes: mins(66) },
    ],
  },

  // ── LEVEL 5 ───────────────────────────────────────────────────────────────
  {
    id: "level-05",
    title: "Level 5: Contract Law Principles",
    description: "The legal foundation of all real estate contracts — validity, status, classifications, discharge, and what makes a contract enforceable.",
    category: "CONTRACTS",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 5,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-05",
    modules: [
      { id: "l05-01", title: "Valid Contracts", description: "The 6 essential elements: offer, acceptance, consideration, capacity, legality, and writing.", estimatedMinutes: mins(24) },
      { id: "l05-02", title: "Contract Legal Status", description: "Void, voidable, unenforceable, and valid contracts — what each means in practice.", estimatedMinutes: mins(23) },
      { id: "l05-03", title: "Contract Classifications", description: "Express vs. implied, bilateral vs. unilateral, executory vs. executed contracts.", estimatedMinutes: mins(29) },
      { id: "l05-04", title: "Additional Contract Considerations", description: "Statute of Frauds, parol evidence rule, assignment, novation, and contingencies.", estimatedMinutes: mins(35) },
      { id: "l05-05", title: "Discharge of Contracts", description: "Performance, agreement, breach, impossibility, rescission, and remedies for breach.", estimatedMinutes: mins(35) },
    ],
  },

  // ── LEVEL 6 ───────────────────────────────────────────────────────────────
  {
    id: "level-06",
    title: "Level 6: Purchase Contracts",
    description: "Georgia Purchase and Sale Agreements in depth — offers, counteroffers, the sales contract, and other key real estate contracts.",
    category: "CONTRACTS",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 4,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-06",
    modules: [
      { id: "l06-01", title: "Offers, Counteroffers, and Multiple Offers", description: "How offers are made, accepted, rejected; counteroffer mechanics; handling multiple offers.", estimatedMinutes: mins(35) },
      { id: "l06-02", title: "The Sales Contract", description: "GAR Form F20 deep dive — all sections, earnest money, due diligence, closing date.", estimatedMinutes: mins(64) },
      { id: "l06-03", title: "Sales Contract Workshop", description: "Practical exercises completing and reviewing a full Georgia Purchase and Sale Agreement.", estimatedMinutes: mins(20) },
      { id: "l06-04", title: "Other Real Estate Contracts", description: "Option contracts, land contracts, lease-purchase agreements, and right of first refusal.", estimatedMinutes: mins(19) },
    ],
  },

  // ── LEVEL 7 ───────────────────────────────────────────────────────────────
  {
    id: "level-07",
    title: "Level 7: Agency Principles",
    description: "The legal and practical foundations of agency — what agency is, who plays what role, how it's created, and how it ends.",
    category: "AGENCY",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 6,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-07",
    modules: [
      { id: "l07-01", title: "The Nature of Agency Relationships", description: "What agency is, principal-agent relationships, and the basis of agent authority.", estimatedMinutes: mins(16) },
      { id: "l07-02", title: "Roles People Play in Agency Relationships", description: "Principal, agent, third party — who is who and what duties each owes.", estimatedMinutes: mins(11) },
      { id: "l07-03", title: "Classifications of Agency", description: "Universal, general, and special agency — how each applies to real estate.", estimatedMinutes: mins(21) },
      { id: "l07-04", title: "Responsibilities in the Relationships", description: "Fiduciary duties (LODCAR) — Loyalty, Obedience, Disclosure, Confidentiality, Accounting, Reasonable Care.", estimatedMinutes: mins(47) },
      { id: "l07-05", title: "Creation of Agency", description: "Express agency, implied agency, ratification, and estoppel — how agency is legally created.", estimatedMinutes: mins(25) },
      { id: "l07-06", title: "Termination of Agency", description: "How agency ends: completion, revocation, renunciation, operation of law, and more.", estimatedMinutes: mins(19) },
    ],
  },

  // ── LEVEL 8 ───────────────────────────────────────────────────────────────
  {
    id: "level-08",
    title: "Level 8: Role of an Agent in a Real Estate Transaction",
    description: "How Georgia brokerage works — single agency, dual agency, subagency, no agency, and how agents are compensated.",
    category: "AGENCY",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 5,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-08",
    modules: [
      { id: "l08-01", title: "Agency and Brokerage", description: "BRRETA overview — Georgia's Brokerage Relationships in Real Estate Transactions Act.", estimatedMinutes: mins(25) },
      { id: "l08-02", title: "Single Agency", description: "Exclusive buyer or seller representation — duties, disclosures, and benefits.", estimatedMinutes: mins(15) },
      { id: "l08-03", title: "Dual Agency", description: "Representing both parties — legal requirements, consent, and Georgia-specific rules.", estimatedMinutes: mins(13) },
      { id: "l08-04", title: "Subagency and No Agency", description: "When a licensee assists without representing either party — transaction brokerage in Georgia.", estimatedMinutes: mins(21) },
      { id: "l08-05", title: "Compensation", description: "How agents are paid — commission splits, referral fees, flat fees, and RESPA considerations.", estimatedMinutes: mins(13) },
    ],
  },

  // ── LEVEL 9 ───────────────────────────────────────────────────────────────
  {
    id: "level-09",
    title: "Level 9: Written Brokerage Engagements",
    description: "Georgia brokerage engagement agreements — listing agreements, buyer rep agreements, and transaction coordinator agreements.",
    category: "AGENCY",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 5,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-09",
    modules: [
      { id: "l09-01", title: "Brokerage Engagements", description: "Purpose and requirements of written brokerage engagement agreements under BRRETA.", estimatedMinutes: mins(26) },
      { id: "l09-02", title: "Types of Listing Agreements", description: "Exclusive right to sell, exclusive agency, open listing — differences and uses.", estimatedMinutes: mins(21) },
      { id: "l09-03", title: "Listing Agreements and Their Key Paragraphs", description: "GAR listing agreement walkthrough — all key clauses, terms, price, and commission.", estimatedMinutes: mins(51) },
      { id: "l09-04", title: "Buyer Rep Agreements and Their Key Paragraphs", description: "GAR buyer brokerage agreement — duties, compensation, exclusivity, and termination.", estimatedMinutes: mins(33) },
      { id: "l09-05", title: "Transaction Coordinator Agreements and Their Key Paragraphs", description: "Transaction brokerage and TC agreements — scope of services and liability.", estimatedMinutes: mins(21) },
    ],
  },

  // ── LEVEL 10 ──────────────────────────────────────────────────────────────
  {
    id: "level-10",
    title: "Level 10: Property Condition and Disclosures",
    description: "What must be disclosed, when, and by whom — property condition, environmental issues, public controls, and agent liability.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 8,
    estimatedHours: 8,
    certifiable: true,
    badgeId: "badge-level-10",
    modules: [
      { id: "l10-01", title: "Property Condition Disclosure", description: "Georgia Seller's Disclosure Statement requirements — what sellers must reveal.", estimatedMinutes: mins(19) },
      { id: "l10-02", title: "Need for Inspection", description: "Why inspections matter, types of inspections, and the agent's role in recommending them.", estimatedMinutes: mins(36) },
      { id: "l10-03", title: "Material Facts Related to Property Condition", description: "What constitutes a material fact and the agent's duty to disclose defects.", estimatedMinutes: mins(21) },
      { id: "l10-04", title: "Material Facts Related to Environmental Issues I", description: "Lead paint, asbestos, radon, underground storage tanks, and federal disclosure requirements.", estimatedMinutes: mins(35) },
      { id: "l10-05", title: "Material Facts Related to Environmental Issues II", description: "Mold, urea-formaldehyde, electromagnetic fields, wetlands, and flood zones.", estimatedMinutes: mins(29) },
      { id: "l10-06", title: "Material Facts Related to Public Controls", description: "Zoning, building codes, planned developments, and eminent domain affecting the property.", estimatedMinutes: mins(29) },
      { id: "l10-07", title: "Liability for Property Disclosure", description: "Agent liability — errors and omissions, misrepresentation, and limiting risk.", estimatedMinutes: mins(20) },
      { id: "l10-08", title: "Warranties", description: "Express and implied warranties, habitability warranties, and new home builder warranties.", estimatedMinutes: mins(16) },
    ],
  },

  // ── LEVEL 11 ──────────────────────────────────────────────────────────────
  {
    id: "level-11",
    title: "Level 11: Finance — Mortgage Fundamentals",
    description: "History of mortgages, how they work, the primary and secondary markets, and the math behind interest and amortization.",
    category: "FINANCE",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 8,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-11",
    modules: [
      { id: "l11-01", title: "A Short History of Mortgages", description: "How mortgage lending evolved from early America to today's lending environment.", estimatedMinutes: mins(12) },
      { id: "l11-02", title: "Mortgage Instruments", description: "The promissory note, mortgage vs. deed of trust, and how they work together.", estimatedMinutes: mins(34) },
      { id: "l11-03", title: "The Primary Mortgage Market", description: "Institutional lenders — banks, credit unions, savings institutions, and mortgage bankers.", estimatedMinutes: mins(14) },
      { id: "l11-04", title: "The Secondary Mortgage Market", description: "Fannie Mae, Freddie Mac, Ginnie Mae — how they buy loans and set underwriting standards.", estimatedMinutes: mins(27) },
      { id: "l11-05", title: "Basic Math Concepts", description: "Percentages, fractions, and the math foundation needed for all real estate calculations.", estimatedMinutes: mins(14) },
      { id: "l11-06", title: "Calculating Interest", description: "Simple interest formula, annual/monthly interest, and interest-only payment calculations.", estimatedMinutes: mins(20) },
      { id: "l11-07", title: "Calculating Amortized Loan Payments", description: "Monthly payment formula, amortization schedules, and payment calculation practice.", estimatedMinutes: mins(23) },
      { id: "l11-08", title: "More Mortgage Math", description: "Points, origination fees, APR, qualifying ratios, and prepayment penalty math.", estimatedMinutes: mins(18) },
    ],
  },

  // ── LEVEL 12 ──────────────────────────────────────────────────────────────
  {
    id: "level-12",
    title: "Level 12: Methods of Financing",
    description: "All major loan types — fixed-rate, adjustable-rate, FHA, VA, USDA, home equity, refinancing, and mortgage insurance.",
    category: "FINANCE",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 9,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-12",
    modules: [
      { id: "l12-01", title: "Basic Categories of Mortgages", description: "Conventional vs. government-backed, conforming vs. nonconforming loan basics.", estimatedMinutes: mins(10) },
      { id: "l12-02", title: "Fixed-Rate and Adjustable-Rate Mortgages", description: "How fixed-rate and ARM loans work, index, margin, caps, and adjustment periods.", estimatedMinutes: mins(19) },
      { id: "l12-03", title: "Other Types of Home Loans", description: "Balloon loans, interest-only mortgages, reverse mortgages, and purchase-money mortgages.", estimatedMinutes: mins(24) },
      { id: "l12-04", title: "Refinancing", description: "Rate-and-term vs. cash-out refinance, break-even analysis, and when refinancing makes sense.", estimatedMinutes: mins(16) },
      { id: "l12-05", title: "Equity Loans", description: "Home equity loans, HELOCs, second mortgages — how they work and their risks.", estimatedMinutes: mins(7) },
      { id: "l12-06", title: "Federal Housing Administration (FHA)", description: "FHA loan requirements, MIP, down payment minimums, and FHA appraisal standards.", estimatedMinutes: mins(15) },
      { id: "l12-07", title: "VA Loans", description: "VA eligibility, entitlement, funding fee, no-down-payment feature, and VA appraisals.", estimatedMinutes: mins(14) },
      { id: "l12-08", title: "USDA Loan Programs", description: "USDA Rural Development loans — eligibility, income limits, guarantee fee, and benefits.", estimatedMinutes: mins(12) },
      { id: "l12-09", title: "Mortgage Insurance", description: "PMI vs. MIP — when required, how calculated, and when/how it can be removed.", estimatedMinutes: mins(11) },
    ],
  },

  // ── LEVEL 13 ──────────────────────────────────────────────────────────────
  {
    id: "level-13",
    title: "Level 13: Instruments of Finance",
    description: "The legal documents behind real estate loans — promissory notes, security instruments, mortgage provisions, and foreclosure.",
    category: "FINANCE",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 7,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-13",
    modules: [
      { id: "l13-01", title: "The ABCs of Mortgage Loans", description: "Mortgage basics — lender, borrower, note, security instrument, and the process overview.", estimatedMinutes: mins(19) },
      { id: "l13-02", title: "Promissory Notes", description: "Elements of a valid note, types of notes, maker and payee, and acceleration clauses.", estimatedMinutes: mins(15) },
      { id: "l13-03", title: "Security Instruments", description: "Mortgage vs. deed of trust — lien theory vs. title theory states and how Georgia handles it.", estimatedMinutes: mins(18) },
      { id: "l13-04", title: "Mortgage Provisions", description: "Key mortgage clauses — due-on-sale, defeasance, satisfaction, and subordination.", estimatedMinutes: mins(11) },
      { id: "l13-05", title: "Foreclosure Basics", description: "What triggers foreclosure, types of foreclosure, and basic timeline.", estimatedMinutes: mins(14) },
      { id: "l13-06", title: "Foreclosure Paths", description: "Judicial vs. non-judicial foreclosure, Georgia's non-judicial process, and deed in lieu.", estimatedMinutes: mins(21) },
      { id: "l13-07", title: "Alternatives to Foreclosure", description: "Short sales, loan modifications, forbearance, deed in lieu — pros, cons, and process.", estimatedMinutes: mins(16) },
    ],
  },

  // ── LEVEL 14 ──────────────────────────────────────────────────────────────
  {
    id: "level-14",
    title: "Level 14: The Lending Process",
    description: "How a mortgage loan goes from application to closing — origination, borrower qualification, collateral evaluation, and creating the mortgage.",
    category: "FINANCE",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 4,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-14",
    modules: [
      { id: "l14-01", title: "Loan Origination Basics", description: "Loan application (1003), Loan Estimate, prequalification vs. preapproval process.", estimatedMinutes: mins(23) },
      { id: "l14-02", title: "Qualifying the Borrower", description: "Credit analysis, income verification, DTI ratios, Fannie/Freddie underwriting guidelines.", estimatedMinutes: mins(28) },
      { id: "l14-03", title: "Qualifying the Collateral", description: "Appraisal requirements, LTV calculations, and how the property affects loan approval.", estimatedMinutes: mins(11) },
      { id: "l14-04", title: "Creating a Mortgage", description: "Underwriting process, loan commitment, conditions, and the closing process timeline.", estimatedMinutes: mins(21) },
    ],
  },

  // ── LEVEL 15 ──────────────────────────────────────────────────────────────
  {
    id: "level-15",
    title: "Level 15: Property Management",
    description: "Managing properties professionally — specializations, marketing, leasing, maintenance, finances, statutory compliance, and risk management.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 7,
    estimatedHours: 9,
    certifiable: true,
    badgeId: "badge-level-15",
    modules: [
      { id: "l15-01", title: "The Basics of Property Management", description: "Property manager role, duties, relationship with owner, and types of managed properties.", estimatedMinutes: mins(17) },
      { id: "l15-02", title: "Property Management Specializations", description: "Residential, commercial, industrial, HOA — different PM specializations and their demands.", estimatedMinutes: mins(22) },
      { id: "l15-03", title: "Marketing, Tenants, and Rent", description: "Vacancy marketing, tenant screening, fair housing in leasing, and setting rent levels.", estimatedMinutes: mins(27) },
      { id: "l15-04", title: "Duties of Property Management: Maintenance and Finance", description: "Maintenance programs, vendor management, trust accounting, budgets, and financial reports.", estimatedMinutes: mins(43) },
      { id: "l15-05", title: "The Property Management Agreement", description: "Key elements of the PM contract — scope, compensation, authority, and liability.", estimatedMinutes: mins(28) },
      { id: "l15-06", title: "Statutory Compliance in Property Management", description: "Georgia Landlord-Tenant Act, security deposit rules, notice requirements, and eviction.", estimatedMinutes: mins(15) },
      { id: "l15-07", title: "Risk Management and Insurance", description: "Liability exposure, property insurance types, errors & omissions, and risk mitigation.", estimatedMinutes: mins(24) },
    ],
  },

  // ── LEVEL 16 ──────────────────────────────────────────────────────────────
  {
    id: "level-16",
    title: "Level 16: Leasehold Interests",
    description: "Everything about leases — types, valid elements, lease agreements, and landlord-tenant rights and obligations.",
    category: "OTHER",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 3,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-16",
    modules: [
      { id: "l16-01", title: "Types of Leases", description: "Gross, net, percentage, ground, and residential leases — structures and use cases.", estimatedMinutes: mins(32) },
      { id: "l16-02", title: "Elements of a Valid Lease", description: "Offer and acceptance, consideration, capacity, legal purpose, writing requirements.", estimatedMinutes: mins(22) },
      { id: "l16-03", title: "Lease Agreements", description: "Key lease provisions — term, rent, security deposits, maintenance, and renewal options.", estimatedMinutes: mins(18) },
    ],
  },

  // ── LEVEL 17 ──────────────────────────────────────────────────────────────
  {
    id: "level-17",
    title: "Level 17: Property Valuation",
    description: "How value is defined and influenced in real estate — the forces of supply and demand, CMAs, and the CMA workshop.",
    category: "VALUATION",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 4,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-17",
    modules: [
      { id: "l17-01", title: "Value in Real Estate", description: "Types of value (market, assessed, appraised), DUST principle, and the four forces that affect value.", estimatedMinutes: mins(43) },
      { id: "l17-02", title: "Supply and Demand", description: "Real estate market cycles, absorption rates, and how supply and demand drive prices.", estimatedMinutes: mins(21) },
      { id: "l17-03", title: "Comparative Market Analysis", description: "How to conduct a CMA — selecting comps, making adjustments, and arriving at a price opinion.", estimatedMinutes: mins(38) },
      { id: "l17-04", title: "CMA Workshop", description: "Hands-on practice completing a full Comparative Market Analysis with sample properties.", estimatedMinutes: mins(30) },
    ],
  },

  // ── LEVEL 18 ──────────────────────────────────────────────────────────────
  {
    id: "level-18",
    title: "Level 18: Calculating Value — The Three Approaches",
    description: "Formal appraisal methods — sales comparison, cost, and income approaches, plus assessed value for property taxes.",
    category: "VALUATION",
    licenseType: "SALESPERSON",
    difficulty: "ADVANCED",
    totalModules: 5,
    estimatedHours: 5,
    certifiable: true,
    badgeId: "badge-level-18",
    modules: [
      { id: "l18-01", title: "The Practice of Appraisal", description: "USPAP, the appraisal process, appraisal vs. CMA, and types of value in appraisal.", estimatedMinutes: mins(22) },
      { id: "l18-02", title: "Sales Comparison Approach", description: "Selecting comparables, adjustments, paired sales analysis, and reconciling a range of value.", estimatedMinutes: mins(20) },
      { id: "l18-03", title: "Cost Approach", description: "Reproduction vs. replacement cost, types of depreciation (physical, functional, external), and land value.", estimatedMinutes: mins(13) },
      { id: "l18-04", title: "Income Approach", description: "GRM, GIM, NOI, cap rate, and the income capitalization method for income-producing properties.", estimatedMinutes: mins(21) },
      { id: "l18-05", title: "Assessed Value", description: "How property is assessed for tax purposes, millage rates, homestead exemptions, and tax appeals.", estimatedMinutes: mins(12) },
    ],
  },

  // ── LEVEL 19 ──────────────────────────────────────────────────────────────
  {
    id: "level-19",
    title: "Level 19: Transfer of Title",
    description: "How real property passes from one owner to another — deeds, deed elements, types of deeds, inheritance, and title.",
    category: "CLOSING",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 5,
    estimatedHours: 7,
    certifiable: true,
    badgeId: "badge-level-19",
    modules: [
      { id: "l19-01", title: "Deeds and the Transfer of Property", description: "What a deed is, voluntary vs. involuntary transfer, and the deed delivery and acceptance process.", estimatedMinutes: mins(24) },
      { id: "l19-02", title: "Elements of a Valid Deed", description: "Grantor, grantee, consideration, legal description, granting clause, signature, acknowledgment, delivery.", estimatedMinutes: mins(28) },
      { id: "l19-03", title: "Types of Deeds", description: "General warranty deed, special warranty deed, quitclaim deed, bargain and sale deed, and sheriff's deed.", estimatedMinutes: mins(35) },
      { id: "l19-04", title: "Conveyance After Death", description: "Testate vs. intestate succession, wills, probate, descent and distribution in Georgia.", estimatedMinutes: mins(35) },
      { id: "l19-05", title: "Title", description: "Title vs. deed, chain of title, abstract of title, title search, title insurance, and marketable title.", estimatedMinutes: mins(29) },
    ],
  },

  // ── LEVEL 20 ──────────────────────────────────────────────────────────────
  {
    id: "level-20",
    title: "Level 20: Finance and Closing in Georgia",
    description: "The Georgia closing process from contract to keys — who does what, closing costs, prorations, and the closing disclosure.",
    category: "CLOSING",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 2,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-20",
    modules: [
      { id: "l20-01", title: "The Closing Process", description: "Georgia's attorney closing requirement, timeline, title search, and what happens at the closing table.", estimatedMinutes: mins(33) },
      { id: "l20-02", title: "Closing Costs", description: "Buyer and seller closing costs, prorations, transfer taxes, recording fees, and the CD (Closing Disclosure).", estimatedMinutes: mins(21) },
    ],
  },

  // ── LEVEL 21 ──────────────────────────────────────────────────────────────
  {
    id: "level-21",
    title: "Level 21: Government Oversight of the Real Estate Industry",
    description: "Federal laws governing financing disclosures — TILA, RESPA, Dodd-Frank/TRID, credit laws, and predatory lending.",
    category: "FINANCE",
    licenseType: "SALESPERSON",
    difficulty: "ADVANCED",
    totalModules: 4,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-21",
    modules: [
      { id: "l21-01", title: "TILA and RESPA", description: "Truth in Lending Act disclosures, APR, RESPA Section 8 kickbacks, and HUD-1 requirements.", estimatedMinutes: mins(32) },
      { id: "l21-02", title: "Dodd-Frank and TRID", description: "CFPB creation, TILA-RESPA Integrated Disclosures, Loan Estimate, and Closing Disclosure.", estimatedMinutes: mins(18) },
      { id: "l21-03", title: "Other Financing and Credit Laws", description: "ECOA, HMDA, CRA, FCRA, and their impact on mortgage lending and fair lending.", estimatedMinutes: mins(21) },
      { id: "l21-04", title: "Predatory Lending and Mortgage Fraud", description: "Red flags for predatory lending, common mortgage fraud schemes, and agent liability.", estimatedMinutes: mins(38) },
    ],
  },

  // ── LEVEL 22 ──────────────────────────────────────────────────────────────
  {
    id: "level-22",
    title: "Level 22: Ethical Real Estate Practice",
    description: "Ethics, risk management, antitrust law, and trust account management — the professional standards every agent must follow.",
    category: "LICENSE_LAW",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 5,
    estimatedHours: 6,
    certifiable: true,
    badgeId: "badge-level-22",
    modules: [
      { id: "l22-01", title: "Introduction to Ethics", description: "What ethics means in real estate, NAR Code of Ethics overview, and common ethical dilemmas.", estimatedMinutes: mins(25) },
      { id: "l22-02", title: "Risk Management", description: "Managing professional liability, common agent mistakes, and reducing exposure to lawsuits.", estimatedMinutes: mins(12) },
      { id: "l22-03", title: "What Is Antitrust?", description: "Sherman Antitrust Act basics, price fixing, market allocation, and group boycotts in real estate.", estimatedMinutes: mins(35) },
      { id: "l22-04", title: "Antitrust Legislation and Penalties", description: "Federal and state antitrust penalties and how to avoid violations in practice.", estimatedMinutes: mins(12) },
      { id: "l22-05", title: "Trust Accounts", description: "Georgia requirements for earnest money handling, trust account setup, commingling prohibitions.", estimatedMinutes: mins(26) },
    ],
  },

  // ── LEVEL 23 ──────────────────────────────────────────────────────────────
  {
    id: "level-23",
    title: "Level 23: Fair Housing Law",
    description: "Federal and Georgia fair housing law — protected classes, prohibited conduct, enforcement, and agent responsibilities.",
    category: "FAIR_HOUSING",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 9,
    estimatedHours: 11,
    certifiable: true,
    badgeId: "badge-level-23",
    modules: [
      { id: "l23-01", title: "Fair Housing Acts", description: "Civil Rights Act of 1866, Fair Housing Act of 1968, all seven protected classes, and amendments.", estimatedMinutes: mins(37) },
      { id: "l23-02", title: "Fair Lending Acts", description: "ECOA, HMDA, and CRA — how they work alongside fair housing to prevent lending discrimination.", estimatedMinutes: mins(18) },
      { id: "l23-03", title: "Fair Housing Court Cases", description: "Key fair housing cases — what they established and their impact on real estate practice.", estimatedMinutes: mins(12) },
      { id: "l23-04", title: "Fair Housing Exemptions", description: "Religious organizations, private clubs, senior housing, and owner-occupied small buildings.", estimatedMinutes: mins(15) },
      { id: "l23-05", title: "Federal Disability Law", description: "Fair Housing Amendment, ADA, reasonable accommodations, accessibility requirements.", estimatedMinutes: mins(32) },
      { id: "l23-06", title: "Steering, Blockbusting, and Redlining", description: "Definitions, examples, how to spot violations, and the agent's affirmative obligation.", estimatedMinutes: mins(17) },
      { id: "l23-07", title: "Advertising", description: "Fair housing in advertising — NFHA guidelines, HUD rules, and prohibited phrases.", estimatedMinutes: mins(25) },
      { id: "l23-08", title: "Complaints, Enforcement, and Penalties", description: "HUD complaint process, civil penalties, private lawsuits, and criminal penalties.", estimatedMinutes: mins(30) },
      { id: "l23-09", title: "Responsibilities and Scenarios", description: "Agent obligations, scenario-based practice, and building a fair housing compliant practice.", estimatedMinutes: mins(23) },
    ],
  },

  // ── LEVEL 24 ──────────────────────────────────────────────────────────────
  {
    id: "level-24",
    title: "Level 24: Regulatory Structure in Georgia",
    description: "Georgia-specific licensing law — GREC, license types, requirements, exemptions, obtaining a license, and maintaining it.",
    category: "LICENSE_LAW",
    licenseType: "SALESPERSON",
    difficulty: "INTERMEDIATE",
    totalModules: 4,
    estimatedHours: 4,
    certifiable: true,
    badgeId: "badge-level-24",
    modules: [
      { id: "l24-01", title: "Georgia Real Estate Licensing Law", description: "Overview of the Georgia Real Estate License Act — authority, purpose, and history of GREC.", estimatedMinutes: mins(11) },
      { id: "l24-02", title: "License Requirements and Exemptions", description: "Who needs a license, who is exempt, and the penalties for unlicensed activity.", estimatedMinutes: mins(15) },
      { id: "l24-03", title: "Obtaining a License", description: "Education requirements, exam application, background check, fingerprinting, and affiliate broker.", estimatedMinutes: mins(24) },
      { id: "l24-04", title: "Maintaining a License", description: "Post-license education, CE requirements, renewal cycle, inactive status, and reinstatement.", estimatedMinutes: mins(29) },
    ],
  },

  // ── LEVEL 25 ──────────────────────────────────────────────────────────────
  {
    id: "level-25",
    title: "Level 25: Real Estate Practice in Georgia",
    description: "Broker supervision, GREC regulations on commissions, advertising rules, and brokerage-specific compliance requirements.",
    category: "LICENSE_LAW",
    licenseType: "SALESPERSON",
    difficulty: "ADVANCED",
    totalModules: 4,
    estimatedHours: 5,
    certifiable: true,
    badgeId: "badge-level-25",
    modules: [
      { id: "l25-01", title: "Broker Supervision and Management", description: "GREC broker responsibilities — supervising licensees, office requirements, and policy manuals.", estimatedMinutes: mins(32) },
      { id: "l25-02", title: "Commission Procedures and Regulations", description: "How commissions are set, paid, and disputed — GREC rules on compensation and co-broking.", estimatedMinutes: mins(29) },
      { id: "l25-03", title: "Legislation Governing Brokerage Advertising", description: "GREC advertising rules — required disclosures, team names, and social media compliance.", estimatedMinutes: mins(11) },
      { id: "l25-04", title: "Brokerage Advertising", description: "Practical advertising compliance — yard signs, online listings, business cards, and websites.", estimatedMinutes: mins(20) },
    ],
  },

  // ── LEVEL 26 ──────────────────────────────────────────────────────────────
  {
    id: "level-26",
    title: "Level 26: Conclusion & Georgia PL Final Exam",
    description: "Course wrap-up, next steps to licensure, and the Georgia Pre-License Final Exam simulation covering all 25 levels.",
    category: "LICENSE_LAW",
    licenseType: "SALESPERSON",
    difficulty: "ADVANCED",
    totalModules: 2,
    estimatedHours: 2,
    certifiable: true,
    badgeId: "badge-exam-ready",
    modules: [
      { id: "l26-01", title: "What's Next? — Your Path to Licensure", description: "After this course: GREC exam application, scheduling PSI exam, and your first broker.", estimatedMinutes: mins(7) },
      { id: "l26-02", title: "Georgia PL Final Exam", description: "Full-length final exam simulating the Georgia Pre-License state board exam — all topics covered.", estimatedMinutes: 120 },
    ],
  },
];

// ─── Badges ──────────────────────────────────────────────────────────────────

export const BADGES = [
  { id: "badge-level-01", label: "RE Foundations",   icon: "🏗️",  description: "Completed Level 1: Real Estate Foundations" },
  { id: "badge-level-02", label: "Ownership Expert", icon: "🏠",  description: "Completed Level 2: Real Property Ownership" },
  { id: "badge-level-03", label: "Land Surveyor",    icon: "📐",  description: "Completed Level 3: Legal Land Descriptions" },
  { id: "badge-level-04", label: "Land Use Pro",     icon: "🗺️",  description: "Completed Level 4: Land Use Controls" },
  { id: "badge-level-05", label: "Contract Law",     icon: "⚖️",  description: "Completed Level 5: Contract Law Principles" },
  { id: "badge-level-06", label: "PSA Master",       icon: "📄",  description: "Completed Level 6: Purchase Contracts" },
  { id: "badge-level-07", label: "Agency Pro",       icon: "🤝",  description: "Completed Level 7: Agency Principles" },
  { id: "badge-level-08", label: "Agent Role",       icon: "👔",  description: "Completed Level 8: Role of an Agent" },
  { id: "badge-level-09", label: "Brokerage Ace",    icon: "📋",  description: "Completed Level 9: Written Brokerage Engagements" },
  { id: "badge-level-10", label: "Disclosure Pro",   icon: "🔍",  description: "Completed Level 10: Property Condition & Disclosures" },
  { id: "badge-level-11", label: "Finance Basics",   icon: "💵",  description: "Completed Level 11: Finance — Mortgage Fundamentals" },
  { id: "badge-level-12", label: "Loan Types",       icon: "🏦",  description: "Completed Level 12: Methods of Financing" },
  { id: "badge-level-13", label: "Instruments",      icon: "📑",  description: "Completed Level 13: Instruments of Finance" },
  { id: "badge-level-14", label: "Lending Pro",      icon: "✅",  description: "Completed Level 14: The Lending Process" },
  { id: "badge-level-15", label: "PM Expert",        icon: "🔧",  description: "Completed Level 15: Property Management" },
  { id: "badge-level-16", label: "Lease Master",     icon: "🔑",  description: "Completed Level 16: Leasehold Interests" },
  { id: "badge-level-17", label: "Value Analyst",    icon: "📈",  description: "Completed Level 17: Property Valuation" },
  { id: "badge-level-18", label: "Appraiser",        icon: "📊",  description: "Completed Level 18: Calculating Value" },
  { id: "badge-level-19", label: "Title Expert",     icon: "📜",  description: "Completed Level 19: Transfer of Title" },
  { id: "badge-level-20", label: "Closing Pro",      icon: "🎉",  description: "Completed Level 20: Finance and Closing in GA" },
  { id: "badge-level-21", label: "TRID Master",      icon: "🏛️",  description: "Completed Level 21: Government Oversight" },
  { id: "badge-level-22", label: "Ethics Ace",       icon: "🌟",  description: "Completed Level 22: Ethical Real Estate Practice" },
  { id: "badge-level-23", label: "Fair Housing",     icon: "🏘️",  description: "Completed Level 23: Fair Housing Law" },
  { id: "badge-level-24", label: "GA License Law",   icon: "🍑",  description: "Completed Level 24: Regulatory Structure in Georgia" },
  { id: "badge-level-25", label: "GA Practice",      icon: "⭐",  description: "Completed Level 25: Real Estate Practice in Georgia" },
  { id: "badge-exam-ready", label: "Exam Ready!",   icon: "🎓",  description: "Completed the full Georgia Pre-License curriculum" },
  { id: "badge-first-pass",  label: "First Step",   icon: "🚀",  description: "Completed your first module" },
  { id: "badge-streak-7",    label: "7-Day Streak", icon: "🔥",  description: "Studied 7 days in a row" },
  { id: "badge-perfect",     label: "Perfect Score",icon: "💯",  description: "Scored 100% on any practice test" },
];
