export interface HNItem {
  id: number;
  type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
  by: string;
  time: number;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNStory extends HNItem {
  type: 'story';
  title: string;
  score: number;
  descendants: number;
}

export interface HNComment extends HNItem {
  type: 'comment';
  text: string;
  parent: number;
}

export interface Story {
  id: number;
  title: string;
  url?: string;
  author: string;
  points: number;
  commentCount: number;
  time: number;
  text?: string;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  time: number;
  children: Comment[];
  hasUnloadedChildren?: boolean; // True if comment has children that weren't loaded due to depth limit
}

export interface Bookmark {
  id: number;
  storyId: number;
  title: string;
  url?: string;
  author: string;
  points: number;
  commentCount: number;
  createdAt: Date;
  bookmarkedAt: Date;
}

export interface SummaryResult {
  summary: string;
  key_points: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
}

export interface Summary {
  id: number;
  storyId: number;
  summaryText: string;
  keyPoints: string[];
  sentiment: string;
  createdAt: Date;
}
