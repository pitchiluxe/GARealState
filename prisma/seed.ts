import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🍑 Seeding GA Real Estate Playground...");

  // ─── Demo users ───────────────────────────────────────────────────────────
  const password = await bcrypt.hash("demo1234", 10);

  const student = await prisma.user.upsert({
    where: { email: "demo@garealstate.ai" },
    update: {},
    create: {
      email: "demo@garealstate.ai",
      name: "Alex Johnson",
      password,
      role: "STUDENT",
      agentId: "STU-001",
      isActive: true,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@garealstate.ai" },
    update: {},
    create: {
      email: "instructor@garealstate.ai",
      name: "Sarah Williams",
      password,
      role: "INSTRUCTOR",
      agentId: "INS-001",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@garealstate.ai" },
    update: {},
    create: {
      email: "admin@garealstate.ai",
      name: "Admin User",
      password,
      role: "ADMIN",
      agentId: "ADM-001",
      isActive: true,
    },
  });

  console.log("✅ Users created");

  // ─── Breakroom channels ───────────────────────────────────────────────────
  const channels = [
    { name: "general",       type: "TEXT",  position: 0 },
    { name: "announcements", type: "TEXT",  position: 1 },
    { name: "exam-tips",     type: "TEXT",  position: 2 },
    { name: "study-lounge",  type: "VOICE", position: 3 },
    { name: "group-review",  type: "VOICE", position: 4 },
  ];

  for (const ch of channels) {
    await prisma.breakroomChannel.upsert({
      where: { name: ch.name },
      update: {},
      create: ch,
    });
  }

  // Seed a few welcome messages
  const general = await prisma.breakroomChannel.findUnique({ where: { name: "general" } });
  if (general) {
    const existingMsg = await prisma.breakroomMessage.findFirst({
      where: { channel: "general", userId: instructor.id },
    });
    if (!existingMsg) {
      await prisma.breakroomMessage.create({
        data: {
          userId: instructor.id,
          content: "Welcome to GA Real Estate Playground! 🍑 Use this space to ask questions, share tips, and connect with fellow candidates.",
          channel: "general",
          msgType: "TEXT",
        },
      });
      await prisma.breakroomMessage.create({
        data: {
          userId: instructor.id,
          content: "📚 Pro tip: Start with the License Law module in the Classroom — it's the most heavily tested topic on the GA exam!",
          channel: "exam-tips",
          msgType: "TEXT",
        },
      });
    }
  }

  console.log("✅ Breakroom channels seeded");

  // ─── Knowledge Base Articles ──────────────────────────────────────────────
  const articles = [
    // LICENSE LAW
    {
      slug: "grec-overview",
      title: "Georgia Real Estate Commission (GREC) Overview",
      summary: "Understand the role, powers, and structure of the GREC as the governing body for real estate licenses in Georgia.",
      content: `# Georgia Real Estate Commission (GREC)

The Georgia Real Estate Commission (GREC) is the state agency that regulates real estate licensees in Georgia. Established under the Georgia Real Estate License Law (O.C.G.A. § 43-40), GREC's primary mission is to protect consumers through licensee education and regulation.

## Structure
- Composed of 6 members appointed by the Governor
- Members serve 5-year staggered terms
- Must include both brokers and public members
- Headquartered in Atlanta, GA

## Powers and Duties
- Issue, renew, suspend, and revoke licenses
- Establish education requirements for licensure
- Investigate complaints against licensees
- Hold hearings and impose sanctions
- Promulgate rules and regulations

## Key Rules
- GREC can suspend a license for up to 60 days without a hearing
- Full revocation requires a formal hearing
- Licensees must comply with the Trust Funds Act
- Advertising must comply with GREC Rule 520-1-.09

## License Types Regulated
- Community Association Manager (CAM)
- Salesperson
- Associate Broker
- Broker`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["GREC", "license law", "regulation", "Georgia"]),
      product: "ALL",
      difficulty: "BEGINNER",
    },
    {
      slug: "salesperson-license-requirements",
      title: "Salesperson License Requirements in Georgia",
      summary: "Complete requirements to obtain a Georgia real estate salesperson license including education, exam, and application.",
      content: `# Georgia Salesperson License Requirements

## Pre-License Education
- **75 hours** of approved pre-license education
- Must be completed at an approved school
- Covers: Real Estate Principles & Practices, Georgia License Law, Real Estate Law, Real Estate Finance

## Examination
- Administered by PSI (testing vendor)
- Two parts: National (national real estate topics) + State (Georgia-specific)
- Minimum passing score: **72%** on each part
- Must pass both parts within **12 months** of each other
- Can retake failed sections unlimited times (fee per attempt)

## Application Requirements
- Must be at least 18 years old
- High school diploma or GED
- Must be sponsored by an active Georgia broker
- Background check (fingerprinting required)
- Application fee to GREC

## After Licensing
- License is issued in **inactive** status initially
- Must be activated under a sponsoring broker
- **36 hours** of post-license education required within first year
- Then **36 hours** of CE every 4 years for renewal`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["salesperson", "license requirements", "exam", "pre-license"]),
      product: "SALESPERSON",
      difficulty: "BEGINNER",
    },
    {
      slug: "broker-license-requirements",
      title: "Broker License Requirements in Georgia",
      summary: "Requirements to upgrade from salesperson to broker including experience, education, and exam.",
      content: `# Georgia Broker License Requirements

## Experience Requirement
- Must hold an active salesperson license for **3 of the last 5 years**
- Experience must be actively engaged in real estate

## Pre-Broker Education
- **60 hours** of approved broker pre-license education
- Topics: Brokerage operations, trust funds, office management, advanced real estate law

## Examination
- Broker exam is separate from the salesperson exam
- Same two-part format: National + State
- Passing score: **75%** on each part

## Types of Broker Licenses
- **Associate Broker**: Works under another broker, cannot run own firm
- **Broker**: Can operate independently or own a firm
- **Qualifying Broker**: The designated broker responsible for a real estate company

## Responsibilities of a Qualifying Broker
- Responsible for all licensees in the firm
- Must maintain trust account
- Responsible for advertising compliance
- Must keep transaction records for 3 years`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["broker", "license upgrade", "qualifying broker", "experience"]),
      product: "BROKER",
      difficulty: "INTERMEDIATE",
    },
    // CONTRACTS
    {
      slug: "purchase-and-sale-agreement",
      title: "Georgia Purchase and Sale Agreement (GAR Form F20)",
      summary: "Understanding the standard Georgia Association of Realtors Purchase and Sale Agreement used in residential transactions.",
      content: `# Georgia Purchase and Sale Agreement

The GAR Purchase and Sale Agreement (Form F20) is the standard contract used in most residential real estate transactions in Georgia.

## Key Components

### Parties
- Buyer and Seller must be identified
- Agent/Broker information included

### Property Description
- Legal description (or tax parcel ID)
- Address and county
- Personal property included/excluded

### Purchase Price and Financing
- Total purchase price
- Earnest money amount and holder
- Financing contingency terms
- Loan type (conventional, FHA, VA, cash)

### Closing
- Closing date (typically 30-60 days from acceptance)
- Possession at closing vs. after
- Prorations (taxes, HOA, utilities)

### Contingencies
- Financing contingency
- Due diligence / inspection period (typically 10 days)
- Sale of buyer's home contingency (if applicable)

## Earnest Money
- Held by broker in trust account (not personal account)
- Typically 1-5% of purchase price
- Disbursement rules if deal falls through depend on contract terms

## Time is of the Essence
- Georgia contracts typically include this clause
- Deadlines are binding — missing a deadline can constitute breach`,
      category: "CONTRACTS",
      tags: JSON.stringify(["purchase and sale", "GAR forms", "contracts", "earnest money"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    {
      slug: "listing-agreements",
      title: "Types of Listing Agreements in Georgia",
      summary: "Overview of exclusive right to sell, exclusive agency, and open listing agreements and their key differences.",
      content: `# Listing Agreements in Georgia

## Types of Listing Agreements

### 1. Exclusive Right to Sell (Most Common)
- **Broker earns commission** regardless of who sells the property
- Even if the seller finds the buyer themselves, broker gets paid
- Most protection for the broker
- Standard in Georgia residential real estate

### 2. Exclusive Agency
- Broker earns commission UNLESS the seller finds buyer themselves
- Seller can avoid commission if they sell directly
- Rare in residential; occasionally in commercial

### 3. Open Listing (Non-Exclusive)
- Seller can list with multiple brokers
- Only the broker who brings the buyer earns commission
- Seller can sell themselves with no commission
- Common in FSBO situations

### 4. Net Listing (ILLEGAL in Georgia)
- Broker keeps everything above a set net price
- Prohibited under GREC rules — conflict of interest
- Can result in license suspension/revocation

## Key Elements of Any Listing Agreement
- Duration/expiration date (GREC requires a definite termination date)
- Commission rate or fee
- Property description
- List price
- Broker's duties
- Seller's duties and representations

## Important Note
GREC Rule 520-1-.09 requires all listing agreements to have a **definite expiration date** — no evergreen or auto-renewing listings.`,
      category: "CONTRACTS",
      tags: JSON.stringify(["listing agreement", "exclusive right to sell", "open listing", "commission"]),
      product: "ALL",
      difficulty: "BEGINNER",
    },
    // AGENCY
    {
      slug: "agency-relationships",
      title: "Agency Relationships in Georgia Real Estate",
      summary: "Understanding client vs. customer relationships, fiduciary duties, and disclosure requirements under Georgia law.",
      content: `# Agency Relationships in Georgia Real Estate

## Client vs. Customer
- **Client**: Has a fiduciary relationship with the agent (represented party)
- **Customer**: Does not have a fiduciary relationship — receives honest, fair dealing only

## Types of Agency

### Buyer's Agency
- Agent represents the buyer
- Fiduciary duties owed to buyer
- Must disclose material facts about the property
- Commission typically paid by seller through cooperative arrangement

### Seller's Agency (Listing Agency)
- Agent represents the seller
- Fiduciary duties owed to seller
- Can still share property info with all parties

### Dual Agency
- Agent represents BOTH buyer AND seller in same transaction
- LEGAL in Georgia but requires written informed consent from both parties
- Agent cannot give full fiduciary duty to either party
- Must remain neutral

### Designated Agency
- Broker designates one agent for buyer, another for seller
- Both agents in same firm but different people
- Each agent gives full representation to their client
- Preferred alternative to dual agency

## Fiduciary Duties (CLIENT)
- **L**oyalty
- **O**bedience
- **D**isclosure
- **C**onfidentiality
- **A**ccounting
- **R**easonable care

## Disclosure Requirement
Georgia requires written **Brokerage Engagements** — agents must provide clients with the required disclosure form at first substantive contact.`,
      category: "AGENCY",
      tags: JSON.stringify(["agency", "fiduciary", "dual agency", "buyer agency", "disclosure"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // FINANCE
    {
      slug: "mortgage-types",
      title: "Types of Mortgages and Loans in Georgia",
      summary: "Overview of conventional, FHA, VA, USDA loans and key financing concepts tested on the Georgia real estate exam.",
      content: `# Mortgage and Loan Types

## Conventional Loans
- Not government-backed
- Typically requires 620+ credit score
- Down payment: 3-20%
- PMI required if less than 20% down
- Conforming vs. non-conforming (jumbo)

## FHA Loans (Federal Housing Administration)
- Government-insured (not government-funded)
- Down payment: **3.5%** (with 580+ credit score)
- Down payment: 10% (with 500-579 credit score)
- MIP (Mortgage Insurance Premium) required for life of loan if < 10% down
- More lenient qualification requirements
- Good for first-time buyers

## VA Loans (Veterans Affairs)
- For eligible veterans, active-duty, surviving spouses
- **No down payment** required
- No PMI
- VA funding fee (can be financed)
- Competitive rates

## USDA Loans
- For rural and suburban properties
- No down payment required
- Income limits apply
- Area eligibility requirements

## Key Financing Terms
- **LTV (Loan-to-Value)**: Loan amount / Appraised value × 100
- **DTI (Debt-to-Income)**: Monthly debt / Gross monthly income × 100
- **Points**: Prepaid interest; 1 point = 1% of loan amount
- **ARM**: Adjustable Rate Mortgage — rate changes after initial fixed period
- **Amortization**: Process of paying off loan through regular payments

## RESPA (Real Estate Settlement Procedures Act)
- Federal law governing closing disclosures
- Requires Loan Estimate within 3 days of application
- Requires Closing Disclosure 3 days before closing
- Prohibits kickbacks between settlement service providers`,
      category: "FINANCE",
      tags: JSON.stringify(["mortgage", "FHA", "VA", "conventional", "financing", "RESPA"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // PROPERTY
    {
      slug: "property-ownership",
      title: "Types of Property Ownership and Estates",
      summary: "Freehold vs. leasehold estates, fee simple, life estate, and concurrent ownership types tested on the GA exam.",
      content: `# Property Ownership and Estates

## Types of Estates

### Freehold Estates (Ownership)

**Fee Simple Absolute**
- Most complete form of ownership
- Unlimited duration, freely transferable
- Can be inherited
- Most common form of residential ownership

**Fee Simple Defeasible**
- Fee simple subject to a condition
- Can be lost if condition violated
- Example: "To ABC Church, so long as used for religious purposes"

**Life Estate**
- Ownership for the duration of a person's life
- Life tenant: person with the life estate
- Remainderman: receives property when life estate ends
- Pur autre vie: life estate based on another person's life
- Life tenant cannot waste or destroy property

### Leasehold Estates (Possession without ownership)
- Estate for years: specific start and end date
- Periodic tenancy: auto-renews (month-to-month)
- Tenancy at will: either party can end with notice
- Tenancy at sufferance: holdover tenant (illegal)

## Concurrent Ownership (Multiple Owners)

**Joint Tenancy**
- Right of survivorship (deceased owner's share passes to other owners)
- 4 unities required: Time, Title, Interest, Possession (TTIP)
- Must be equal shares

**Tenancy in Common**
- Most common form of co-ownership
- No right of survivorship
- Unequal shares allowed
- Each owner can sell their share independently

**Tenancy by the Entirety**
- Only between **married couples**
- Right of survivorship
- Neither spouse can transfer without the other's consent
- NOT recognized in Georgia for real property

**Community Property**
- Georgia is NOT a community property state`,
      category: "PROPERTY",
      tags: JSON.stringify(["fee simple", "life estate", "joint tenancy", "tenancy in common", "property rights"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // VALUATION
    {
      slug: "property-valuation-approaches",
      title: "The Three Approaches to Property Value",
      summary: "Sales comparison, cost, and income approaches to appraisal — key concepts and when each approach is used.",
      content: `# Three Approaches to Property Valuation

## 1. Sales Comparison Approach (Market Approach)
**Best for**: Residential properties, vacant land

- Compare subject property to recently sold comparable properties (comps)
- Adjust for differences between subject and comps
- Most relied-upon approach for single-family homes

**Steps:**
1. Identify 3+ comparable sales
2. Make adjustments (additions for inferior comps, subtractions for superior comps)
3. Reconcile adjusted sale prices to arrive at value estimate

**Key Rule**: If the comp is BETTER than the subject, SUBTRACT from comp's price. If WORSE, ADD to comp's price.

## 2. Cost Approach
**Best for**: New construction, special-use properties, insurance purposes

- Land value + (Reproduction/Replacement cost - Depreciation)
- Reproduction cost: exact replica
- Replacement cost: same utility with modern materials

**Types of Depreciation:**
- **Physical deterioration**: Wear and tear (curable vs. incurable)
- **Functional obsolescence**: Outdated features (e.g., 1 bathroom in 5-bedroom home)
- **External obsolescence**: Outside the property — always incurable (highway nearby)

## 3. Income Approach (Capitalization)
**Best for**: Income-producing properties (apartments, commercial)

**GRM (Gross Rent Multiplier)**
- Sale Price / Monthly Gross Rent = GRM
- Simple, quick estimate

**Direct Capitalization**
- NOI / Cap Rate = Value
- NOI = Gross Income - Vacancy - Operating Expenses
- Cap Rate reflects investor's required return

## Reconciliation
Appraiser weighs all three approaches and reconciles to a **final value estimate** (not an average).`,
      category: "VALUATION",
      tags: JSON.stringify(["appraisal", "sales comparison", "cost approach", "income approach", "CMA", "cap rate"]),
      product: "ALL",
      difficulty: "ADVANCED",
    },
    // FAIR HOUSING
    {
      slug: "fair-housing-laws",
      title: "Federal Fair Housing Act and Georgia Fair Housing",
      summary: "Protected classes, prohibited conduct, exemptions, and penalties under the Fair Housing Act.",
      content: `# Federal Fair Housing Act (1968)

## Protected Classes (Federal — RRNHFDS)
1. **R**ace
2. **R**eligion
3. **N**ational Origin
4. **H**andicap/Disability (added 1988)
5. **F**amilial Status (added 1988) — families with children under 18
6. **C**olor
7. **S**ex/Gender

**Memory Trick**: "RRNHFCS" or "Race, Religion, National origin, Handicap, Familial, Color, Sex"

## Prohibited Conduct
- **Steering**: Directing buyers toward/away from neighborhoods based on protected class
- **Blockbusting/Panic Selling**: Inducing homeowners to sell by suggesting protected classes are moving in
- **Redlining**: Denying loans/insurance based on neighborhood demographics
- **Discriminatory Advertising**: No language suggesting preference or limitation based on protected class
- **Refusing to sell/rent** to a protected class member

## Exemptions (Federal)
- Owner-occupied buildings with 4 or fewer units (Mrs. Murphy exemption)
- Single-family homes sold/rented without a broker and without discriminatory advertising
- Housing for older persons (55+ communities — 80% of units must have 55+)
- Religious organizations and private clubs for members only

## Georgia Fair Housing
- Adds: **Source of income** (Section 8 vouchers) in some jurisdictions
- Georgia has its own Fair Housing Act (O.C.G.A. § 8-3-200)

## Enforcement and Penalties
- HUD investigates complaints
- Civil penalties up to $21,410 (first offense) — amounts adjust periodically
- Private lawsuits allowed
- DOJ can prosecute pattern/practice cases`,
      category: "FAIR_HOUSING",
      tags: JSON.stringify(["fair housing", "protected classes", "steering", "blockbusting", "discrimination"]),
      product: "ALL",
      difficulty: "BEGINNER",
    },
    // MATH
    {
      slug: "real-estate-math-commission",
      title: "Commission Calculations — Step by Step",
      summary: "How to calculate broker and agent commissions, splits, and net proceeds for the GA exam.",
      content: `# Commission Math for the GA Exam

## Basic Commission Formula
Commission = Sale Price × Commission Rate

**Example**: $350,000 home × 6% = $21,000 total commission

## Commission Splits
Most commissions are split between listing broker and selling broker (50/50 is common).

**Example**:
- Total commission: $21,000
- Listing broker gets: $10,500 (50%)
- Selling broker gets: $10,500 (50%)
- Each agent gets 70% of their broker's share: $7,350

## Net Proceeds to Seller
Net Proceeds = Sale Price - Mortgage Payoff - Commission - Closing Costs

**Example**:
- Sale price: $350,000
- Mortgage balance: $220,000
- Commission (6%): $21,000
- Closing costs: $4,500
- **Net to seller: $104,500**

## Proration Formula (Taxes)
Daily Rate = Annual Amount ÷ 365
Seller's Share = Daily Rate × Days Seller Owned in Period

**Example**: Annual taxes = $3,650 | Closing date = March 31 (day 90)
- Daily rate: $3,650 ÷ 365 = **$10/day**
- Seller owes: $10 × 90 = **$900**

## Exam Tips
- Commission is always based on SALE PRICE, not list price
- If the seller pays 6% and it splits 50/50, each broker gets 3%
- "Net listing" (broker keeps above a set price) is ILLEGAL in Georgia`,
      category: "MATH",
      tags: JSON.stringify(["commission", "math", "proration", "calculations", "net proceeds"]),
      product: "ALL",
      difficulty: "BEGINNER",
    },
    {
      slug: "real-estate-math-loan",
      title: "Loan & Mortgage Math — LTV, Points, Monthly Payments",
      summary: "Loan-to-value ratio, discount points, monthly payment, and amortization calculations for the PSI exam.",
      content: `# Mortgage Math Formulas

## Loan-to-Value (LTV)
LTV = Loan Amount ÷ Appraised Value × 100

**Example**: $280,000 loan on $350,000 home
LTV = 280,000 ÷ 350,000 × 100 = **80% LTV**

PMI is required when LTV > 80% (conventional loan)

## Down Payment
Down Payment = Purchase Price × Down Payment %
Loan Amount = Purchase Price - Down Payment

**Example**: $350,000 × 20% down = $70,000 down | $280,000 loan

## Discount Points
1 point = 1% of the loan amount
Paid to LOWER the interest rate (each point ≈ lowers rate by 0.125%)

**Example**: 2 points on $280,000 loan = 2% × $280,000 = **$5,600** paid at closing

## Monthly Payment (PITI)
PITI = Principal + Interest + Taxes + Insurance

Quick approximation: $5.37/month per $1,000 borrowed at 6% for 30 years

**Example**: $280,000 loan × $5.37 ÷ 1,000 = approx. **$1,504/month** P&I

## Qualifying Ratios
- Front-end ratio: Housing costs ÷ Gross monthly income ≤ 28%
- Back-end (DTI): All monthly debts ÷ Gross monthly income ≤ 36-43%

## Exam Tips
- Points are always calculated on the LOAN amount, not sale price
- LTV determines if PMI is needed, not the down payment dollar amount
- Higher points = lower rate = more upfront cost`,
      category: "MATH",
      tags: JSON.stringify(["LTV", "points", "mortgage math", "down payment", "DTI"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    {
      slug: "real-estate-math-cap-rate",
      title: "Cap Rate, GRM & Income Property Math",
      summary: "Capitalization rate, gross rent multiplier, NOI and income approach calculations for investment property.",
      content: `# Income Property Math

## Net Operating Income (NOI)
NOI = Gross Rental Income - Vacancy Loss - Operating Expenses

**Note**: Do NOT subtract mortgage payments — NOI is before debt service

**Example**:
- Gross annual rent: $120,000
- Vacancy (5%): -$6,000
- Operating expenses: -$40,000
- **NOI = $74,000**

## Capitalization Rate (Cap Rate)
Cap Rate = NOI ÷ Property Value × 100
Property Value = NOI ÷ Cap Rate

**Example**: NOI = $74,000 | Cap Rate = 7%
Value = $74,000 ÷ 0.07 = **$1,057,143**

**Key Relationship**: Cap rate ↑ → Value ↓ (inverse relationship)

## Gross Rent Multiplier (GRM)
GRM = Sale Price ÷ Monthly Gross Rent
Estimated Value = GRM × Monthly Rent

**Example**: Similar building sold for $600,000 with $5,000/month rent
GRM = $600,000 ÷ $5,000 = **120**
Subject property at $4,800/month: $4,800 × 120 = **$576,000**

## Cash-on-Cash Return
Annual Cash Flow ÷ Total Cash Invested × 100

## Exam Tips
- Cap rate is used for INCOME properties only
- GRM uses MONTHLY rent; annual GRM uses annual rent (know which one the question uses)
- Higher cap rate = RISKIER investment = LOWER price
- The IRV formula: Income = Rate × Value`,
      category: "MATH",
      tags: JSON.stringify(["cap rate", "GRM", "NOI", "income property", "investment", "IRV"]),
      product: "ALL",
      difficulty: "ADVANCED",
    },
    // PROPERTY
    {
      slug: "land-use-zoning",
      title: "Land Use Controls, Zoning & Planning in Georgia",
      summary: "Zoning classifications, variances, nonconforming uses, and government land use powers tested on the GA exam.",
      content: `# Land Use Controls & Zoning

## Public Land Use Controls (Government Powers)

### Police Power (Most Important)
- Government's right to regulate land use for public health, safety, morals, welfare
- Source of zoning authority
- No compensation required unless it's a taking

### Eminent Domain
- Government takes private property for public use
- Must pay **just compensation**
- Condemnation = legal process of eminent domain
- Inverse condemnation: owner sues when government takes without compensation

### Taxation
- Ad valorem (property) taxes — based on assessed value
- Special assessments for specific improvements (sidewalks, sewers)

### Escheat
- Property reverts to state when owner dies without a will or heirs

## Zoning Classifications
- **R** (Residential): R-1, R-2, R-3 (single-family, multi-family, etc.)
- **C** (Commercial): retail, offices
- **I** (Industrial): manufacturing, warehousing
- **A** (Agricultural): farming

## Special Zoning Concepts

**Nonconforming Use**
- Existing use that no longer complies after rezoning
- "Grandfathered" — can continue but cannot be expanded
- If destroyed, must be rebuilt to current code

**Variance**
- Permission to deviate from zoning requirements
- Area variance (size/setback) vs. use variance (different use)
- Must show undue hardship

**Conditional Use Permit (Special Exception)**
- Allows a use that's not normally permitted in a zone
- Schools and churches in residential zones

**Spot Zoning**
- Rezoning a single parcel differently from surrounding area
- Generally illegal if arbitrary

## Exam Tips
- Buffer zones separate incompatible uses
- Zoning is police power — no compensation
- Eminent domain requires compensation`,
      category: "PROPERTY",
      tags: JSON.stringify(["zoning", "land use", "eminent domain", "police power", "variance", "nonconforming"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    {
      slug: "environmental-issues",
      title: "Environmental Issues in Georgia Real Estate",
      summary: "Lead paint, asbestos, radon, mold, underground storage tanks and disclosure requirements for the GA exam.",
      content: `# Environmental Issues in Real Estate

## Lead-Based Paint
- Banned in residential use in **1978**
- Disclosure required for homes built BEFORE 1978
- Federal law: sellers must provide EPA pamphlet "Protect Your Family from Lead"
- Buyers get 10-day window to test (can waive)
- Applies to sales AND rentals

## Asbestos
- Common in buildings built before 1980
- Used in insulation, floor tiles, roof shingles
- Friable asbestos (can crumble) = immediate hazard
- Non-friable (intact) may not require immediate removal
- Must be handled by licensed abatement contractor

## Radon
- Naturally occurring radioactive gas from uranium decay
- Colorless, odorless — only detected by testing
- EPA action level: **4 pCi/L**
- Mitigation: sub-slab depressurization system
- Georgia has moderate radon levels in some areas

## Mold
- Requires moisture source
- Not federally regulated like lead/asbestos
- Georgia: no specific mold disclosure law but material defect disclosure applies
- Seller must disclose known water intrusion issues

## Underground Storage Tanks (USTs)
- Petroleum products in soil = contamination concern
- EPA regulates USTs at gas stations, dry cleaners, etc.
- Phase I Environmental Site Assessment: records review (no soil testing)
- Phase II: actual soil/water sampling

## CERCLA (Superfund)
- Comprehensive Environmental Response, Compensation, and Liability Act
- Holds current AND past owners liable for cleanup
- Innocent landowner defense: conducted proper due diligence

## Exam Tips
- Lead paint disclosure = pre-1978 homes only
- Radon action level = 4 pCi/L
- CERCLA = Superfund = liability for contamination`,
      category: "PROPERTY",
      tags: JSON.stringify(["environmental", "lead paint", "asbestos", "radon", "mold", "CERCLA", "disclosure"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // LICENSE LAW
    {
      slug: "brreta-brokerage-relationships",
      title: "BRRETA — Brokerage Relationships in Real Estate Transactions Act",
      summary: "Georgia's BRRETA law covering broker duties, disclosure requirements, and types of brokerage engagements.",
      content: `# BRRETA — Brokerage Relationships in Real Estate Transactions Act

BRRETA (O.C.G.A. § 10-6A) governs the relationships between real estate licensees and the public in Georgia. It is one of the most heavily tested topics on the Georgia PSI exam.

## Key Provisions

### Brokerage Engagement Required
- Must be in writing before an agent represents a buyer or seller
- Creates the agency relationship
- Must be signed by both parties

### First Substantive Contact Rule
Georgia agents must present the **"Brokerage Relationships in Real Estate Transactions" disclosure form** at first substantive contact with a potential client or customer.

### Types of Brokerage Relationships Under BRRETA

**Seller's Broker**
- Represents the seller
- Owes fiduciary duties to seller
- Must disclose all known material facts about the property to buyers

**Buyer's Broker**
- Represents the buyer
- Owes fiduciary duties to buyer
- Must disclose all known material facts about the buyer to the seller? NO — must protect buyer's confidential info

**Dual Agent**
- Represents both buyer and seller in same transaction
- Must get WRITTEN informed consent from both parties
- Cannot disclose: buyer's max price or seller's min price

**Designated Agent**
- Broker designates one affiliated licensee for buyer, another for seller
- Preferred alternative to dual agency
- Each designated agent gives full representation

### Minimum Duties to ALL Parties (Even Customers)
1. Timely present all offers and counteroffers
2. Disclose all adverse material facts
3. Account for all money
4. Comply with all fair housing laws

## Exam Tips
- BRRETA replaced the subagency default in Georgia
- Disclosure form ≠ brokerage engagement — disclosure just explains the options
- Dual agency requires WRITTEN consent, not just verbal
- In Georgia, cooperating brokers are NOT automatically subagents`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["BRRETA", "brokerage engagement", "dual agency", "disclosure", "Georgia law"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    {
      slug: "trust-accounts-georgia",
      title: "Trust Accounts and Earnest Money Rules in Georgia",
      summary: "GREC requirements for handling client funds, trust account rules, commingling, and conversion.",
      content: `# Trust Accounts & Earnest Money in Georgia

## Trust Account Requirements

### Who Must Maintain a Trust Account
- Every qualifying broker who holds client funds
- Must be separate from operating accounts
- Must be in a federally insured financial institution in Georgia

### What Goes in the Trust Account
- Earnest money deposits
- Security deposits (property management)
- Advance fees
- Any client funds held on behalf of others

## Earnest Money Rules

### When Must Earnest Money Be Deposited?
- Within **3 banking days** of contract acceptance
- Broker must deposit in trust account (not personal account)

### Who Holds Earnest Money?
- Typically the listing broker (unless contract states otherwise)
- Can be held by closing attorney if specified

### Disputed Earnest Money
If buyer and seller both claim the earnest money:
1. Broker can **interplead** (turn over to court)
2. Broker should NOT disburse without written consent from both parties OR court order
3. Holding disputed funds is NOT commingling

## Prohibited Conduct

**Commingling** — mixing client funds with broker's personal/operating funds
- GREC violation — grounds for license suspension or revocation

**Conversion** — using client funds for personal use
- Criminal offense AND GREC violation
- One of the most serious violations

## Examination Tips
- 3 banking days to deposit — not 3 calendar days
- Earnest money goes to ESCROW (trust), not to seller at contract signing
- Broker cannot keep interest on trust account (unless specifically authorized)
- Shortage in trust account = potential criminal liability`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["trust account", "earnest money", "commingling", "conversion", "GREC", "escrow"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    {
      slug: "continuing-education-renewal",
      title: "License Renewal and Continuing Education in Georgia",
      summary: "CE hour requirements, renewal deadlines, late renewal, and inactive license rules for all license types.",
      content: `# Georgia License Renewal & CE Requirements

## Salesperson License Renewal

### First Renewal (Post-License)
- Must complete **36 hours** of post-license education
- Completed within **12 months** of initial license activation
- Failure to complete = license placed on inactive status

### Subsequent Renewals
- **36 hours** of CE every **4-year** renewal cycle
- Must include:
  - 3 hours: License Law
  - 3 hours: Real Estate-related topics
  - Remaining hours: any approved CE

## Broker License Renewal
- Same 36-hour CE requirement every 4 years
- Additional broker-specific topics required

## Renewal Deadlines
- Licenses expire on a **4-year cycle** based on original issue month
- Grace period: **90 days** after expiration with late fee
- After 90 days: must retake education and exam (treated as new applicant)

## Inactive License
- Licensee cannot practice real estate while inactive
- Can reactivate by: completing required CE and paying reinstatement fee
- Inactive license can remain inactive indefinitely (just can't practice)

## Lapsed License
- Expired more than 90 days: must reapply as if new
- Must meet all current education requirements
- May need to retake the exam

## Exam Tips
- First-year post-license = 36 hours (not the regular CE)
- Renewal cycle = 4 years (not annual)
- 90-day grace period with late fee
- GREC can audit CE completion records`,
      category: "LICENSE_LAW",
      tags: JSON.stringify(["CE", "continuing education", "license renewal", "post-license", "inactive license"]),
      product: "ALL",
      difficulty: "BEGINNER",
    },
    // CONTRACTS
    {
      slug: "contract-essentials-georgia",
      title: "Essential Elements of a Valid Real Estate Contract",
      summary: "The 6 required elements for an enforceable real estate contract and common contract defects.",
      content: `# Valid Contract Requirements in Georgia

## 6 Essential Elements (COWLIE)

### 1. Competent Parties
- Both parties must be of legal age (18+) and sound mind
- Corporations act through authorized representatives
- A minor's contract is **voidable** (minor can void it, adult cannot)

### 2. Offer and Acceptance (Mutual Assent)
- Meeting of the minds — both parties agree to same terms
- Acceptance must be **absolute and unqualified**
- Counteroffer = rejection of original offer + new offer

### 3. Written Form (Statute of Frauds)
- Real estate contracts must be **in writing** to be enforceable in Georgia
- Oral real estate contracts are NOT enforceable
- Must be signed by the party being charged

### 4. Lawful Purpose
- Contract cannot be for an illegal purpose
- Example: contract to sell stolen property = void

### 5. Consideration
- Something of value exchanged by both parties
- Money, property, a promise, a service
- Earnest money is consideration but not required for validity
- "Love and affection" can be valid consideration (gifts between family)

### 6. Expressed with Sufficient Certainty
- Essential terms must be clear: parties, property, price, closing date

## Contract Status

**Void**: Has no legal effect (illegal purpose, no consideration)
**Voidable**: Valid but can be canceled by one party (minor's contract, fraud, duress)
**Unenforceable**: Valid between parties but court won't enforce (oral real estate contract)
**Valid/Enforceable**: Meets all requirements

## Exam Tips
- Statute of Frauds = real estate contracts must be written
- Earnest money is NOT required for a valid contract
- A counteroffer kills the original offer completely
- Both parties must be notified of acceptance for it to be effective`,
      category: "CONTRACTS",
      tags: JSON.stringify(["contract elements", "statute of frauds", "void voidable", "consideration", "offer acceptance"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // FINANCE
    {
      slug: "foreclosure-process-georgia",
      title: "Foreclosure Process in Georgia",
      summary: "Georgia's non-judicial foreclosure process, power of sale, redemption rights, and deficiency judgments.",
      content: `# Foreclosure in Georgia

## Georgia's Foreclosure Method
Georgia is a **non-judicial foreclosure** state — lenders can foreclose WITHOUT going to court, as long as the deed of trust/mortgage has a **power of sale clause**.

## Non-Judicial Foreclosure Process
1. Borrower defaults on loan
2. Lender sends **Notice of Default**
3. Lender must advertise the sale in a local newspaper for **4 consecutive weeks**
4. Foreclosure sale held on **first Tuesday of the month**
5. Property sold at courthouse steps to highest bidder
6. Minimum bid = outstanding loan balance

## Key Players
- **Mortgagor**: Borrower (owns the property)
- **Mortgagee**: Lender (holds the mortgage)
- **Trustee**: Third party who holds legal title in deed of trust

## Deed Security Instruments in Georgia
Georgia uses the **Security Deed** (not a traditional mortgage)
- Lender holds legal title until loan is paid off
- Borrower has equitable title
- Makes non-judicial foreclosure easier

## Deficiency Judgment
If the foreclosure sale doesn't cover the full debt, lender can sue for the difference.
- Georgia allows deficiency judgments
- Must be filed within **30 days** of the foreclosure sale

## Right of Redemption
- Georgia has a **statutory right of redemption** after tax sales
- For mortgage foreclosures: Georgia does NOT have a post-foreclosure redemption right (unlike some states)

## Exam Tips
- Georgia = non-judicial state = faster foreclosure
- First Tuesday of the month = foreclosure sale day
- 4-week newspaper advertisement required
- Security Deed is Georgia's main security instrument (not mortgage)`,
      category: "FINANCE",
      tags: JSON.stringify(["foreclosure", "non-judicial", "security deed", "power of sale", "deficiency judgment"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // VALUATION
    {
      slug: "depreciation-appraisal",
      title: "Depreciation in the Cost Approach to Appraisal",
      summary: "Three types of depreciation — physical, functional, and external — with examples and exam strategies.",
      content: `# Depreciation in Real Estate Appraisal

Depreciation is the **loss in value** from any cause. Used in the cost approach:
**Value = Land + Improvements - Depreciation**

## Type 1: Physical Deterioration
Loss from physical wear, age, or damage.

**Curable Physical Deterioration**
- Cost to cure is LESS than the value it adds
- Example: Replacing a broken water heater
- Sometimes called "deferred maintenance"

**Incurable Physical Deterioration**
- Too expensive to cure relative to value added
- Example: Foundation settling on an older building
- Calculated as remaining useful life ratio

## Type 2: Functional Obsolescence
Loss from outdated or poor design features.

**Curable Functional Obsolescence**
- Example: Old kitchen that can be remodeled for less than value gained

**Incurable Functional Obsolescence**
- Example: A 5-bedroom house with only 1 bathroom
- Example: Low ceiling heights

**Superadequacy (Over-improvement)**
- Feature that exceeds market standards: Olympic pool in modest neighborhood

## Type 3: External (Economic) Obsolescence
Loss from factors OUTSIDE the property — ALWAYS incurable.

Examples:
- Freeway built next to residential neighborhood
- Factory opens near residential area
- Economic decline in the area
- Rezoning of neighboring land

**Always incurable** because the cause is outside the property owner's control.

## Quick Reference Table
| Type | Curable? | Examples |
|------|----------|---------|
| Physical | Sometimes | Roof, HVAC, paint |
| Functional | Sometimes | Bad floor plan, no bathrooms |
| External | NEVER | Airport nearby, rezoning |

## Exam Tips
- External obsolescence is ALWAYS incurable
- If the cost to fix > value gained = incurable
- Only physical and functional can be curable
- Depreciation in appraisal ≠ tax depreciation`,
      category: "VALUATION",
      tags: JSON.stringify(["depreciation", "cost approach", "physical obsolescence", "functional obsolescence", "external obsolescence"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // AGENCY
    {
      slug: "disclosure-requirements-georgia",
      title: "Property Disclosure Requirements in Georgia",
      summary: "Seller's Property Disclosure Statement, material defects, latent vs. patent defects, and as-is sales.",
      content: `# Property Disclosure in Georgia

## Georgia Seller's Property Disclosure Statement
- Sellers of residential property (1-4 units) must complete a **Seller's Property Disclosure Statement** (GAR Form F301)
- Discloses known conditions affecting the property
- Covers: structure, roof, plumbing, electrical, HVAC, environmental issues, HOA

## Material vs. Immaterial Facts

**Material Fact**
- A fact that would affect a buyer's decision to purchase or the price they'd pay
- MUST be disclosed by agents AND sellers
- Examples: Roof leaks, foundation cracks, unpermitted additions, easements

**Immaterial Fact**
- Would not affect a reasonable buyer's decision
- Not required to be disclosed

## Latent vs. Patent Defects

**Latent Defect** (Hidden)
- Not visible on reasonable inspection
- Must be disclosed if known
- Example: Mold behind walls, known water intrusion

**Patent Defect** (Visible)
- Observable on reasonable inspection
- Buyer is expected to notice during inspection
- Example: Cracked driveway, obvious water stains

## Psychological Stigma in Georgia
Georgia does NOT require disclosure of:
- Prior murders or deaths in the property
- Prior occupant had AIDS/HIV
- Nearby sex offender (buyer must check registry)

## As-Is Sales
- Buyer accepts the property in its current condition
- Does NOT relieve seller/agent of obligation to disclose KNOWN material defects
- Buyer can still conduct inspections

## Agent's Disclosure Duty
Georgia agents must disclose all **adverse material facts** they know about the property — even if the seller asks them not to.

## Exam Tips
- "As-is" doesn't eliminate duty to disclose known defects
- Psychological stigma = not required in Georgia
- Agent must disclose material facts even without asking`,
      category: "AGENCY",
      tags: JSON.stringify(["disclosure", "material defect", "latent defect", "seller disclosure", "as-is", "patent defect"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
    // CLOSING
    {
      slug: "closing-process",
      title: "The Real Estate Closing Process in Georgia",
      summary: "Step-by-step overview of the Georgia closing process, title insurance, and prorations.",
      content: `# The Real Estate Closing Process

## Georgia Closing Characteristics
- Georgia is an **attorney state** — a licensed attorney must conduct residential closings
- The closing attorney typically represents the lender (or buyer if no lender)
- Closings typically occur at the attorney's office

## Pre-Closing Steps
1. Contract ratification
2. Loan application (buyer)
3. Home inspection (due diligence period)
4. Appraisal ordered by lender
5. Title search and title commitment
6. Survey (if required)
7. Final walk-through (day of or before closing)
8. Closing Disclosure received 3 days before closing

## Closing Disclosure (CD)
- Replaced HUD-1 Settlement Statement in 2015 (TRID rules)
- Borrower must receive CD at least **3 business days** before closing
- Itemizes all costs, loan terms, and cash to close

## Title Insurance
- **Lender's Policy**: Required by lender, protects lender's interest
- **Owner's Policy**: Optional but recommended, protects buyer's equity
- One-time premium paid at closing
- Covers defects in title from before purchase date

## Prorations at Closing
- **Property taxes**: Accrued but not yet paid — seller pays up to day of closing
- **HOA dues**: Prorated to closing date
- **Rent** (if tenant occupied): Seller pays buyer for days after closing

## Deed Types
- **General Warranty Deed**: Broadest protection — warrants against all title defects (most common in GA)
- **Special Warranty Deed**: Only warrants defects during seller's ownership
- **Quitclaim Deed**: No warranties — transfers whatever interest grantor has
- **Bargain and Sale Deed**: No warranties, used in foreclosures

## FIRPTA
Foreign Investment in Real Property Tax Act — buyer must withhold 15% of sale price if seller is a foreign person, unless exemption applies.`,
      category: "CLOSING",
      tags: JSON.stringify(["closing", "title insurance", "deed", "proration", "closing disclosure", "attorney state"]),
      product: "ALL",
      difficulty: "INTERMEDIATE",
    },
  ];

  for (const article of articles) {
    await prisma.kBArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        isPublished: true,
        authorId: instructor.id,
      },
    });
  }

  console.log(`✅ ${articles.length} KB articles seeded`);

  // ─── Sample practice tests ────────────────────────────────────────────────
  const existingTest = await prisma.practiceTest.findFirst({ where: { studentId: student.id } });
  if (!existingTest) {
    await prisma.practiceTest.create({
      data: {
        testNumber: "PT-2024-001",
        status: "COMPLETED",
        priority: "MEDIUM",
        category: "LICENSE_LAW",
        subject: "GREC Rules and License Requirements",
        description: "Practice test covering GREC authority, license types, and renewal requirements.",
        studentId: student.id,
        score: 82,
        passingScore: 70,
        timeSpent: 1800,
        firstAttempt: true,
        difficulty: "BEGINNER",
        notes: "Strong on license types, review CE requirements more.",
      },
    });

    await prisma.practiceTest.create({
      data: {
        testNumber: "PT-2024-002",
        status: "COMPLETED",
        priority: "HIGH",
        category: "CONTRACTS",
        subject: "Purchase and Sale Agreement Deep Dive",
        description: "Detailed practice on GAR forms, contingencies, and contract terms.",
        studentId: student.id,
        score: 68,
        passingScore: 70,
        timeSpent: 2400,
        firstAttempt: true,
        difficulty: "INTERMEDIATE",
        notes: "Below passing — retake after reviewing earnest money rules.",
      },
    });
  }

  console.log("✅ Sample practice tests seeded");

  // ─── Sample Obsidian notes ────────────────────────────────────────────────
  const noteData = [
    {
      title: "GREC Authority and Powers",
      slug: "grec-authority",
      content: "# GREC Authority\n\nThe [[GREC Overview]] is the regulatory body for GA real estate licensees.\n\n## Key Powers\n- Issue/revoke licenses\n- Set education requirements\n- Investigate complaints\n\n## Related Topics\n- [[License Law]]\n- [[CE Requirements]]\n- [[Disciplinary Actions]]",
      folder: "License Law",
      category: "License Law",
      tags: JSON.stringify(["GREC", "regulation"]),
    },
    {
      title: "Agency and Fiduciary Duties",
      slug: "agency-fiduciary",
      content: "# Agency Relationships\n\nSee [[Agency Relationships]] for full detail.\n\n## LODCAR Duties (to CLIENTS)\n- Loyalty\n- Obedience\n- Disclosure\n- Confidentiality\n- Accounting\n- Reasonable Care\n\n## Dual Agency\nRequires [[Written Informed Consent]] from both parties.",
      folder: "Agency",
      category: "Agency",
      tags: JSON.stringify(["agency", "fiduciary", "LODCAR"]),
    },
    {
      title: "Math Formulas for the GA Exam",
      slug: "math-formulas",
      content: "# Key Math Formulas\n\n## Commission\n- Commission = Sale Price × Commission Rate\n\n## Proration\n- Daily rate = Annual amount / 365\n- Seller's share = Daily rate × days seller owned in period\n\n## Loan-to-Value\n- LTV = Loan Amount / Appraised Value × 100\n\n## Cap Rate\n- Cap Rate = NOI / Property Value × 100\n- Value = NOI / Cap Rate\n\n## GRM\n- GRM = Sale Price / Monthly Rent\n- Value = GRM × Monthly Rent\n\n## Related\n- [[Income Approach]]\n- [[Mortgage Calculations]]",
      folder: "Math",
      category: "Math",
      tags: JSON.stringify(["math", "formulas", "calculations"]),
    },
    {
      title: "Fair Housing Protected Classes",
      slug: "fair-housing-protected",
      content: "# Fair Housing Protected Classes\n\n## Federal (7 Classes)\nMemory: **RRNHFCS**\n1. Race\n2. Religion\n3. National Origin\n4. Handicap\n5. Familial Status\n6. Color\n7. Sex\n\n## Prohibited Acts\n- [[Steering]]\n- [[Blockbusting]]\n- [[Redlining]]\n\n## Key Exemptions\n- Mrs. Murphy (4-unit owner-occupied)\n- 55+ communities\n- Religious organizations",
      folder: "Fair Housing",
      category: "Fair Housing",
      tags: JSON.stringify(["fair housing", "protected classes"]),
    },
    {
      title: "Deed Types in Georgia",
      slug: "deed-types",
      content: "# Deed Types\n\n## General Warranty Deed\n- Most protection for buyer\n- Warrants against ALL defects (forever)\n- Standard in Georgia residential sales\n\n## Special Warranty Deed\n- Only warrants during seller's ownership period\n- Common in commercial transactions\n\n## Quitclaim Deed\n- No warranties at all\n- Transfers \"whatever interest\" grantor has\n- Used in divorces, family transfers, corrections\n\n## See Also\n- [[Closing Process]]\n- [[Title Insurance]]",
      folder: "Contracts",
      category: "Contracts",
      tags: JSON.stringify(["deed", "title", "closing"]),
    },
  ];

  for (const note of noteData) {
    const existing = await prisma.obsidianNote.findUnique({ where: { slug: note.slug } });
    if (!existing) {
      await prisma.obsidianNote.create({
        data: {
          ...note,
          wordCount: note.content.split(/\s+/).length,
          authorId: instructor.id,
        },
      });
    }
  }

  console.log("✅ Obsidian notes seeded");

  // ─── XP tokens for demo student ──────────────────────────────────────────
  const existingToken = await prisma.tokenTransaction.findFirst({ where: { userId: student.id } });
  if (!existingToken) {
    await prisma.tokenTransaction.create({
      data: {
        userId: student.id,
        amount: 250,
        type: "EARN_CLASSROOM",
        description: "Welcome bonus XP",
      },
    });
    await prisma.user.update({
      where: { id: student.id },
      data: { tokens: 250 },
    });
  }

  console.log("✅ Token transactions seeded");
  console.log("\n🍑 GA Real Estate Playground seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Student:    demo@garealstate.ai / demo1234");
  console.log("  Instructor: instructor@garealstate.ai / demo1234");
  console.log("  Admin:      admin@garealstate.ai / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
