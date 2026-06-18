"use client";

import { useState } from "react";
import { Calculator, Search, Copy, Check } from "lucide-react";

const FORMULAS = [
  {
    id: 1, category: "Finance",
    name: "Monthly Mortgage Payment (P&I)",
    formula: "M = P × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]",
    variables: ["P = principal loan amount", "r = monthly interest rate (annual rate ÷ 12)", "n = number of payments (years × 12)"],
    example: "Loan: $200,000 at 7% for 30 years → r = 0.07/12 = 0.005833 → n = 360 → M ≈ $1,330.60/month",
    tips: "Divide annual rate by 12 for monthly rate. Multiply years by 12 for total payments.",
  },
  {
    id: 2, category: "Finance",
    name: "Loan-to-Value Ratio (LTV)",
    formula: "LTV = Loan Amount ÷ Appraised Value × 100",
    variables: ["Loan Amount = the mortgage balance", "Appraised Value = property's appraised or purchase price (use lower)"],
    example: "$180,000 loan ÷ $225,000 value × 100 = 80% LTV",
    tips: "LTV above 80% typically requires PMI on conventional loans.",
  },
  {
    id: 3, category: "Finance",
    name: "Debt-to-Income Ratio (DTI)",
    formula: "DTI = Total Monthly Debt Payments ÷ Gross Monthly Income × 100",
    variables: ["Total Monthly Debt = PITI + all recurring debts", "Gross Monthly Income = income before taxes"],
    example: "$2,500 total debts ÷ $8,000 income = 31.25% DTI",
    tips: "FHA allows up to 43% back-end DTI. Conventional typically 36-45%.",
  },
  {
    id: 4, category: "Valuation",
    name: "Capitalization Rate",
    formula: "Cap Rate = NOI ÷ Property Value × 100",
    variables: ["NOI = Net Operating Income (gross income - operating expenses)", "Property Value = purchase price or market value"],
    example: "NOI $25,000 ÷ $350,000 value = 7.14% cap rate",
    tips: "Higher cap rate = higher risk/return. Lower cap = more stable. Rearrange: Value = NOI ÷ Cap Rate.",
  },
  {
    id: 5, category: "Valuation",
    name: "Gross Rent Multiplier (GRM)",
    formula: "GRM = Property Price ÷ Annual Gross Rent",
    variables: ["Property Price = purchase/sale price", "Annual Gross Rent = yearly gross rental income (all units)"],
    example: "$400,000 ÷ $40,000/year = GRM of 10",
    tips: "GRM ignores expenses. Lower GRM = better investment. Use for quick comparisons.",
  },
  {
    id: 6, category: "Valuation",
    name: "Appreciation / Depreciation",
    formula: "% Change = (New Value - Old Value) ÷ Old Value × 100",
    variables: ["New Value = current or future value", "Old Value = original purchase price"],
    example: "Bought at $200,000, now worth $230,000 → ($230k - $200k) / $200k = 15% appreciation",
    tips: "IRS allows 27.5-year straight-line depreciation for residential rentals.",
  },
  {
    id: 7, category: "Commission",
    name: "Commission Split Calculation",
    formula: "Agent Commission = Sale Price × Total Commission Rate × Agent Split %",
    variables: ["Sale Price = final negotiated price", "Total Commission Rate = total % (e.g. 6%)", "Agent Split % = agent's share of commission (e.g. 70%)"],
    example: "$300,000 × 6% = $18,000 total → 50/50 split → listing broker gets $9,000 → agent at 70% gets $6,300",
    tips: "First split between listing and buyer brokerages, then each broker splits with their agents.",
  },
  {
    id: 8, category: "Commission",
    name: "Net to Seller Calculation",
    formula: "Net = Sale Price - Mortgage Payoff - Commission - Closing Costs",
    variables: ["Sale Price = contract price", "Mortgage Payoff = remaining loan balance + interest", "Commission = total broker fees", "Closing Costs = title, transfer tax, prorations, etc."],
    example: "$350,000 - $180,000 payoff - $21,000 commission - $4,000 costs = $145,000 net",
    tips: "GA transfer tax = $1 per $1,000 of sale price (paid by seller).",
  },
  {
    id: 9, category: "Property Tax",
    name: "Property Tax Calculation",
    formula: "Tax = Assessed Value × Mill Rate ÷ 1,000",
    variables: ["Assessed Value = county-assessed fair market value (40% of FMV in GA)", "Mill Rate = mills set by taxing authority (1 mill = $1 per $1,000)"],
    example: "Home FMV $250,000 → Assessed = $100,000 → At 25 mills → Tax = $100,000 × 25 / 1,000 = $2,500/year",
    tips: "Georgia assesses residential property at 40% of FMV. Apply homestead exemption to reduce assessed value.",
  },
  {
    id: 10, category: "Area & Volume",
    name: "Area Calculations",
    formula: "Rectangle: A = L × W | Triangle: A = ½ × B × H | Trapezoid: A = ½ × (B₁ + B₂) × H",
    variables: ["L = length, W = width (rectangle)", "B = base, H = height (triangle)", "B₁, B₂ = parallel sides, H = height (trapezoid)"],
    example: "Lot: 120 ft × 85 ft = 10,200 sq ft = 10,200 ÷ 43,560 = 0.234 acres",
    tips: "1 acre = 43,560 sq ft | 1 section = 640 acres | 1 mile = 5,280 ft",
  },
  {
    id: 11, category: "Proration",
    name: "Proration (Banker's Method)",
    formula: "Daily Rate = Annual Amount ÷ 360 → Proration = Daily Rate × Days",
    variables: ["Annual Amount = yearly cost (taxes, insurance, HOA)", "360 = banker's year (30 days/month × 12)", "Days = number of days for proration period"],
    example: "Annual tax $3,600 → Daily rate = $10 → Closing Apr 15 → Seller owes 105 days → $10 × 105 = $1,050",
    tips: "Some use 365-day year. Exam usually specifies. Seller pays up to but not including closing day.",
  },
  {
    id: 12, category: "Points",
    name: "Discount Points",
    formula: "1 Point = 1% of Loan Amount | Rate Reduction ≈ 0.25% per point",
    variables: ["Loan Amount = the mortgage principal", "Points = prepaid interest to reduce rate"],
    example: "$200,000 loan, 2 points = $4,000 cost. Reduces rate from 7% to 6.5%.",
    tips: "Break-even: Cost of points ÷ Monthly savings = months to recoup. Tax deductible in year paid.",
  },
];

export default function FormulasPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [copied, setCopied] = useState<number | null>(null);

  const categories = ["ALL", ...Array.from(new Set(FORMULAS.map(f => f.category)))];
  const filtered = FORMULAS.filter(f => {
    const matchCat = category === "ALL" || f.category === category;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.formula.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function copyFormula(id: number, formula: string) {
    navigator.clipboard.writeText(formula);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Formulas & Math</h1>
        <p className="text-gray-500 text-sm">Essential calculations for the GA RE exam</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search formulas..." className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-re-500/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(formula => (
          <div key={formula.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400 mb-2 inline-block">{formula.category}</span>
                <h3 className="text-white font-semibold text-sm">{formula.name}</h3>
              </div>
              <button onClick={() => copyFormula(formula.id, formula.formula)} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-500 hover:text-white transition-all flex-shrink-0">
                {copied === formula.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-black/30 rounded-lg px-3 py-2 mb-3 font-mono text-xs text-re-300 border border-white/8">
              {formula.formula}
            </div>

            <div className="space-y-1 mb-3">
              {formula.variables.map((v, i) => (
                <div key={i} className="text-xs text-gray-500">• {v}</div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/8 border border-blue-500/15">
              <div className="text-xs font-medium text-blue-400 mb-0.5">Example</div>
              <p className="text-xs text-blue-200">{formula.example}</p>
            </div>

            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
              <div className="text-xs font-medium text-amber-400 mb-0.5">Exam Tip</div>
              <p className="text-xs text-amber-200">{formula.tips}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
