"use client";

import { useState } from "react";
import { Bell, ExternalLink, ChevronDown, ChevronUp, Calendar, BookOpen } from "lucide-react";

const LAW_UPDATES = [
  {
    id: 1,
    date: "2024-07-01",
    title: "GREC License Renewal Requirement Update",
    summary: "GREC updated continuing education requirements for license renewal. All licensees must complete 36 hours of CE per 4-year renewal cycle, including mandatory topics.",
    details: "As of the 2024 renewal cycle, Georgia real estate licensees are required to complete 36 hours of approved continuing education every 4 years. The mandatory topics include: Ethics (3 hours), License Law (3 hours), and Real Estate Consumer Protection (3 hours). The remaining 27 hours may be completed in elective topics. Failure to complete CE by the renewal deadline results in license lapse.",
    category: "License Renewal",
    impact: "HIGH",
    source: "GREC Official Bulletin",
  },
  {
    id: 2,
    date: "2024-03-15",
    title: "GAR Purchase and Sale Agreement Form Revisions",
    summary: "The Georgia Association of Realtors updated the standard PSA form with clarifications to inspection contingency timelines and digital signature provisions.",
    details: "The 2024 GAR Purchase and Sale Agreement now includes: (1) Clearer language around due diligence period timing — starting from binding agreement date rather than ratification date. (2) Explicit electronic signature acceptance per Georgia's Electronic Records Act. (3) Updated financing contingency language aligning with current FNMA/FHLMC guidelines. Agents should ensure they are using the current form version.",
    category: "Contracts",
    impact: "MEDIUM",
    source: "Georgia Association of Realtors",
  },
  {
    id: 3,
    date: "2023-10-01",
    title: "Fair Housing Training Now Mandatory for License Renewal",
    summary: "GREC now requires all license renewal applicants to complete a 3-hour fair housing course as part of continuing education.",
    details: "Beginning with license renewals processed on or after October 1, 2023, all Georgia real estate licensees must include a minimum 3-hour fair housing course in their CE completion. The course must be GREC-approved and cover: protected classes, steering/redlining, reasonable accommodations, and complaint filing procedures. This replaces the general ethics portion previously held in that slot for many practitioners.",
    category: "Fair Housing",
    impact: "HIGH",
    source: "GREC",
  },
  {
    id: 4,
    date: "2023-06-20",
    title: "New Disclosure Requirements for Property Condition",
    summary: "Georgia updated seller disclosure requirements to include flood zone status, HVAC age, and presence of synthetic stucco (EIFS).",
    details: "Georgia's seller disclosure form (not mandatory statewide but required in many transactions) was updated to include specific disclosures about: (1) Whether the property lies within a FEMA-designated flood zone; (2) Age and condition of HVAC systems; (3) Presence of Exterior Insulation Finish Systems (EIFS/synthetic stucco) which can trap moisture. While Georgia is a 'buyer beware' state, agents should advise sellers to complete disclosure forms to limit liability.",
    category: "Property",
    impact: "MEDIUM",
    source: "Georgia Legislature",
  },
  {
    id: 5,
    date: "2023-01-01",
    title: "Broker License Experience Requirement Change",
    summary: "GREC increased the active experience requirement for broker license applicants from 1 year to 3 years of active salesperson experience.",
    details: "Effective January 1, 2023, applicants for a Georgia broker license must document 3 years (36 months) of active real estate experience as a licensed salesperson, up from the previous 1-year requirement. The experience must be: within the last 5 years, in good standing without disciplinary action, and accompanied by a letter from the sponsoring broker. Additionally, broker applicants must complete 60 hours of pre-license broker education.",
    category: "License Law",
    impact: "HIGH",
    source: "GREC",
  },
];

export default function UpdatesPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("ALL");

  const categories = ["ALL", ...Array.from(new Set(LAW_UPDATES.map(u => u.category)))];
  const filtered = filter === "ALL" ? LAW_UPDATES : LAW_UPDATES.filter(u => u.category === filter);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Law Updates</h1>
        <p className="text-gray-500 text-sm">Recent changes to Georgia real estate law and regulations</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === c ? "bg-re-500/20 text-re-400 border border-re-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/8"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(update => (
          <div key={update.id} className="glass-card overflow-hidden">
            <button onClick={() => setExpanded(expanded === update.id ? null : update.id)} className="w-full text-left p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" />{update.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${update.impact === "HIGH" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {update.impact} impact
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-re-500/15 text-re-400">{update.category}</span>
                  </div>
                  <h3 className="text-white font-semibold">{update.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{update.summary}</p>
                </div>
                <div className="flex-shrink-0 text-gray-500">
                  {expanded === update.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {expanded === update.id && (
              <div className="px-5 pb-5 pt-0 border-t border-white/8">
                <p className="text-gray-300 text-sm leading-relaxed mt-4">{update.details}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    Source: {update.source}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">These summaries are for study purposes. Always verify current requirements directly with GREC at grec.state.ga.us before advising clients or applying for licenses.</p>
        </div>
      </div>
    </div>
  );
}
