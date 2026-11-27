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
  createdBy: string | null;
  visibility: "tenant" | "public";
}

// A card reference for a playlist's ordered items.
export interface CardRef {
  id: number;
  prompt: string;
  subject: string;
  topic: string;
}

export interface PlaylistItem extends CardRef {
  position: number;
}

// A fuller card row for the curation pool table (sortable + expandable).
export interface PoolCard {
  id: number;
  prompt: string;
  subject: string;
  topic: string;
  difficulty: number;
  createdAt: string;
  choices: Choice[];
  correct: string[];
  explanation: string;
  visibility: "tenant" | "public";
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

export interface StudentTopic {
  subject: string | null;
  topic: string | null;
  answered: number;
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

// --- authoring (draft → review → publish) ----------------------------------

// What the editor collects / submits. visibility: 'tenant' (own school) | 'public'.
export interface DraftInput {
  subject: string;
  topic: string;
  difficulty: number; // 1 leicht · 2 mittel · 3 schwer
  prompt: string;
  choices: Choice[];
  correct: string[]; // ids of the correct choice(s)
  explanation: string;
  visibility: "tenant" | "public";
}

// A card as seen in the author's drafts list / the staff review queue.
export interface Draft {
  id: number;
  status: ModerationStatus;
  subject: string;
  topic: string;
  difficulty: number;
  prompt: string;
  choices: Choice[];
  correct: string[];
  explanation: string;
  visibility: "tenant" | "public";
  mine: boolean;
  reviewNote: string | null;
  createdAt: string;
}
