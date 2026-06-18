import { formatDistanceToNow, format } from "date-fns";

export function formatRelative(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "unknown";
  }
}

export function formatDate(date: string | Date): string {
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function humanizeCategoryName(cat: string): string {
  const map: Record<string, string> = {
    LICENSE_LAW: "License Law",
    CONTRACTS: "Contracts",
    AGENCY: "Agency",
    FINANCE: "Finance",
    PROPERTY: "Property",
    VALUATION: "Valuation",
    FAIR_HOUSING: "Fair Housing",
    CLOSING: "Closing",
    MATH: "Math",
    OTHER: "Other",
  };
  return map[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return `${score}%`;
}

export function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
