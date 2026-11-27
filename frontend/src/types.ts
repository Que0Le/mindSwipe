export interface Choice {
  id: string;
  text: string;
}

export interface Answer {
  correct: string[];
  explanation: string;
}

export interface Post {
  id: number;
  kind: "text" | "card";
  topic: string;
  difficulty: number;
  questionType: "mcq" | "reading";
  prompt: string;
  bodyHtml: string;
  choices: Choice[];
  answer: Answer;
  detailHtml: string;
  tags: string[];
  likeCount: number;
  createdAt: string;
}

export interface FeedPage {
  items: Post[];
  nextCursor: number | null;
  hasMore: boolean;
}

// --- identity / tenancy ----------------------------------------------------

export type Role = "student" | "teacher" | "author" | "tenant_admin";

// Per-tenant feature flags — the same codebase renders different surfaces per
// archetype (Public / Paid / Private) purely from these.
export interface Flags {
  ads: boolean;
  provider_analytics: boolean;
  authoring: boolean;
  advanced: boolean;
  monitoring_dashboard: boolean;
}

export const DEFAULT_FLAGS: Flags = {
  ads: false,
  provider_analytics: false,
  authoring: false,
  advanced: false,
  monitoring_dashboard: false,
};

export interface Identity {
  userId: string;
  isAnonymous: boolean;
  tenantId: number | null;
  role: Role | null;
  displayName: string | null;
  plan: string | null;
  flags: Flags;
}

// --- dashboard -------------------------------------------------------------

export interface Stats {
  answered: number;
  correct: number;
  likes: number;
  viewed: number;
}

export interface TopicMastery {
  topic: string;
  answered: number;
  correct: number;
}

export interface Playlist {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  count: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  sourceType: "playlist" | "topic";
  playlistId: number | null;
  topic: string | null;
  assignee: string | null; // null = whole tenant
  dueAt: string | null;
  progress: { total: number; attempted: number; correct: number };
}

export interface Distractor {
  choiceId: string;
  text: string;
  pickRate: number;
  isCorrect: boolean;
}

export interface CardInsight {
  postId: number;
  position: number;
  prompt: string;
  attempts: number;
  students: number;
  correctRate: number | null;
  medianMs: number | null;
  distractors: Distractor[];
}

export interface ClassMember {
  userId: string;
  displayName: string | null;
  role: Role;
  answered: number;
  correct: number;
}

export interface StudentEffort {
  userId: string;
  displayName: string | null;
  role: Role;
  answered: number;
  accuracy: number | null;
  medianMs: number | null;
  lastAt: string | null;
}

export interface ClassTopic {
  subject: string | null;
  topic: string | null;
  attempts: number;
  students: number;
  accuracy: number | null;
}

export type Segment = "inactive" | "at-risk" | "on-track" | "ahead";

export interface Insight {
  kind: "warn" | "info" | "good";
  text: string;
}

// A swipe session always runs over one of these sources.
export type FeedSource =
  | { type: "all" }
  | { type: "topic"; topic: string }
  | { type: "random"; topics: string[] }
  | { type: "playlist"; playlistId: number; title?: string }
  | { type: "assignment"; assignmentId: number; title?: string };

// --- comments (teacher-moderated student discussion) -----------------------

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface Comment {
  id: number;
  postId: number;
  body: string;
  status: ModerationStatus;
  mine: boolean;
  authorName: string | null;
  createdAt: string;
}
