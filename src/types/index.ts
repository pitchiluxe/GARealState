// ============================================================
// GA Real Estate Playground — Core Type Definitions
// ============================================================

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export interface AppUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  department?: string;
  agentId?: string;
  image?: string | null;
}

// ─── License Types ────────────────────────────────────────────────────────────

export type GARELicenseType =
  | "SALESPERSON"
  | "ASSOCIATE_BROKER"
  | "BROKER"
  | "CAM"
  | "ALL";

export const LICENSE_TYPE_LABELS: Record<GARELicenseType, string> = {
  SALESPERSON:      "Salesperson License",
  ASSOCIATE_BROKER: "Associate Broker License",
  BROKER:           "Broker License",
  CAM:              "Community Association Manager (CAM)",
  ALL:              "All License Types",
};

// ─── Exam Topic Categories ────────────────────────────────────────────────────

export type ExamCategory =
  | "LICENSE_LAW"
  | "CONTRACTS"
  | "AGENCY"
  | "FINANCE"
  | "PROPERTY"
  | "VALUATION"
  | "FAIR_HOUSING"
  | "CLOSING"
  | "MATH"
  | "OTHER";

export const EXAM_CATEGORIES: Record<ExamCategory, string> = {
  LICENSE_LAW:  "License Law & GREC",
  CONTRACTS:    "Contracts & Forms",
  AGENCY:       "Agency Relationships",
  FINANCE:      "Real Estate Finance",
  PROPERTY:     "Property Ownership & Rights",
  VALUATION:    "Property Valuation & Appraisal",
  FAIR_HOUSING: "Fair Housing & Civil Rights",
  CLOSING:      "Closing & Settlement",
  MATH:         "Real Estate Math",
  OTHER:        "Other Topics",
};

// ─── Difficulty ───────────────────────────────────────────────────────────────

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
};

// ─── Study Copilot Types ──────────────────────────────────────────────────────

export interface CopilotInput {
  topicDescription: string;
  category: ExamCategory;
  licenseType: GARELicenseType;
  difficulty: Difficulty;
  specificQuestion?: string;
  priorKnowledge?: string;
  examContext?: string;
}

export interface CopilotResponse {
  sessionId: string;
  category: ExamCategory;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;

  studyTip: string;
  conceptExplanation: string;
  keyFacts: string[];
  examPoints: string[];
  practiceQuestion: string;
  practiceAnswer: string;
  commonMistakes: string[];
  relatedTopics: string[];
  memoryTrick: string;
  georgiaSpecific: string;
  lawReference: string;

  difficultyRating: "EASY" | "MEDIUM" | "HARD";
  studyPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  escalation: {
    needsMoreStudy: boolean;
    urgency: "LOW" | "MEDIUM" | "HIGH";
    reason?: string;
    suggestedResources: string[];
  };

  caseNoteSuggestion: string;
  estimatedStudyTime: string;
}

// ─── Practice Tests ───────────────────────────────────────────────────────────

export type TestStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type TestPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PracticeTest {
  id: string;
  testNumber: string;
  status: TestStatus;
  priority: TestPriority;
  category: ExamCategory;
  subcategory?: string;
  subject: string;
  description: string;
  resolution?: string;
  studentName?: string;
  examVersion?: GARELicenseType;
  score?: number;
  passingScore: number;
  timeSpent?: number;
  firstAttempt: boolean;
  difficulty?: Difficulty;
  notes?: string;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export interface KBArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  product: string;
  difficulty: Difficulty;
  isPublished: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Training / Exam Practice ─────────────────────────────────────────────────

export type TrainingDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXAM_SIMULATION";

export interface TrainingScenario {
  id: string;
  name: string;
  description: string;
  category: ExamCategory;
  licenseType: GARELicenseType;
  difficulty: TrainingDifficulty;
  examinerPersona: string;
  initialQuestion: string;
  objectives: string[];
  keyTopics: string[];
  hint: string;
  modelAnswer: string;
}

export interface TrainingMessage {
  id: string;
  role: "student" | "examiner" | "coach";
  content: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

export interface QAScoreDetails {
  knowledge: number;
  application: number;
  accuracy: number;
  efficiency: number;
  completion: number;
  total: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalTests: number;
  completedTests: number;
  passedTests: number;
  avgScore: number;
  totalStudyTime: number;
  aiSessionsToday: number;
  topCategories: { category: string; count: number }[];
  scoreTrend: { date: string; score: number; tests: number }[];
  categoryBreakdown: { category: string; avg: number; count: number }[];
}

// ─── Classroom ────────────────────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  labScenarioId?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: ExamCategory;
  licenseType: GARELicenseType;
  difficulty: Difficulty;
  totalModules: number;
  estimatedHours: number;
  modules: CourseModule[];
  badgeId?: string;
  certifiable: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
