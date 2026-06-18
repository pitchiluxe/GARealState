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
