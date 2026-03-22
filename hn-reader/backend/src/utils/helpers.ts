import { Comment } from '../types';

export interface FlatComment {
  id: number;
  author: string;
  text: string;
  time: number;
  depth: number;
}

/**
 * Flatten nested comment tree into a flat array with depth information
 */
export function flattenComments(comments: Comment[], depth: number = 0): FlatComment[] {
  const result: FlatComment[] = [];

  for (const comment of comments) {
    result.push({
      id: comment.id,
      author: comment.author,
      text: comment.text,
      time: comment.time,
      depth,
    });

    if (comment.children && comment.children.length > 0) {
      result.push(...flattenComments(comment.children, depth + 1));
    }
  }

  return result;
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  return (
    html
      // Replace <p> with line breaks
      .replace(/<p>/gi, '\n')
      // Replace <br> with line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
  );
}

/**
 * Format time ago from Unix timestamp
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp * 1000) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
