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
