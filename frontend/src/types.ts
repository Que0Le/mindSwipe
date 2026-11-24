export interface Choice {
  id: string;
  text: string;
}

export interface Answer {
  correct: string[];
  explanation: string;
}

export interface Comment {
  id: number;
  postId: number;
  posterId: string;
  kind: "tip" | "related" | "question" | "user" | string;
  content: string;
  createdAt: string;
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
  comments?: Comment[];
}

export interface FeedPage {
  items: Post[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface OfflineInfo {
  generatedAt: string;
  // Full cards currently readable offline (stubs excluded).
  count: number;
  // Cards trimmed to id-only stubs by the size cap (re-fetched online).
  stubCount?: number;
  // Approximate bytes used by the full cards.
  bytes?: number;
  topic: string | null;
  // Keyset position: the highest post id saved so far. The next "Prepare
  // offline" click fetches the batch after this.
  cursor: number;
  hasMore: boolean;
}
