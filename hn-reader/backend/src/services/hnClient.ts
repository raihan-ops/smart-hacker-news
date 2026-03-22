import axios from 'axios';
import { HNItem, HNStory, HNComment, Story, Comment } from '../types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const TIMEOUT = 20000;
const ITEM_FETCH_CONCURRENCY = parseInt(process.env.HN_FETCH_CONCURRENCY || '12', 10);
const MAX_COMMENTS = parseInt(process.env.HN_MAX_COMMENTS || '5000', 10);
const MAX_DEPTH = parseInt(process.env.HN_MAX_COMMENT_DEPTH || '12', 10);

type CommentFetchState = {
  remaining: number;
};

/**
 * Fetch top story IDs
 */
export async function getTopStories(limit: number = 30): Promise<number[]> {
  try {
    const response = await axios.get<number[]>(`${HN_API_BASE}/topstories.json`, {
      timeout: TIMEOUT,
    });
    return response.data.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top stories:', error);
    throw new Error('Failed to fetch top stories from Hacker News');
  }
}

/**
 * Fetch new story IDs
 */
export async function getNewStories(limit: number = 30): Promise<number[]> {
  try {
    const response = await axios.get<number[]>(`${HN_API_BASE}/newstories.json`, {
      timeout: TIMEOUT,
    });
    return response.data.slice(0, limit);
  } catch (error) {
    console.error('Error fetching new stories:', error);
    throw new Error('Failed to fetch new stories from Hacker News');
  }
}

/**
 * Fetch best story IDs
 */
export async function getBestStories(limit: number = 30): Promise<number[]> {
  try {
    const response = await axios.get<number[]>(`${HN_API_BASE}/beststories.json`, {
      timeout: TIMEOUT,
    });
    return response.data.slice(0, limit);
  } catch (error) {
    console.error('Error fetching best stories:', error);
    throw new Error('Failed to fetch best stories from Hacker News');
  }
}

/**
 * Fetch a single item (story, comment, etc.) by ID
 */
export async function getItem(itemId: number): Promise<HNItem | null> {
  try {
    const response = await axios.get<HNItem>(`${HN_API_BASE}/item/${itemId}.json`, {
      timeout: TIMEOUT,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple items with bounded concurrency
 */
export async function getItems(itemIds: number[]): Promise<(HNItem | null)[]> {
  if (!itemIds || itemIds.length === 0) {
    return [];
  }

  const results: (HNItem | null)[] = [];

  for (let i = 0; i < itemIds.length; i += ITEM_FETCH_CONCURRENCY) {
    const batchIds = itemIds.slice(i, i + ITEM_FETCH_CONCURRENCY);
    const batch = await Promise.all(batchIds.map((id) => getItem(id)));
    results.push(...batch);
  }

  return results;
}

/**
 * Convert HNItem to Story format
 */
function toStory(item: HNItem): Story | null {
  if (!item || item.type !== 'story' || !item.title) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    url: item.url,
    author: item.by,
    points: item.score || 0,
    commentCount: item.descendants || 0,
    time: item.time,
    text: item.text,
  };
}

/**
 * Fetch stories by type with pagination
 */
export async function getStories(
  type: 'top' | 'new' | 'best' = 'top',
  page: number = 1,
  limit: number = 30
): Promise<Story[]> {
  let storyIds: number[] = [];

  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  const fetchLimit = limit * 5; // Fetch more to account for filtered items

  switch (type) {
    case 'new':
      storyIds = await getNewStories(offset + fetchLimit);
      break;
    case 'best':
      storyIds = await getBestStories(offset + fetchLimit);
      break;
    case 'top':
    default:
      storyIds = await getTopStories(offset + fetchLimit);
      break;
  }

  // Slice for pagination
  const paginatedIds = storyIds.slice(offset, offset + limit);

  // Fetch story details
  const items = await getItems(paginatedIds);

  // Convert to Story format and filter out nulls
  const stories = items
    .map((item) => (item ? toStory(item) : null))
    .filter((story): story is Story => story !== null);

  return stories;
}

/**
 * Fetch a single story with details
 */
export async function getStory(storyId: number): Promise<Story | null> {
  const item = await getItem(storyId);
  if (!item) return null;
  return toStory(item);
}

/**
 * Recursively fetch comments for a story with optimized parallel fetching
 */
export async function getComments(
  commentIds: number[],
  maxDepth: number = MAX_DEPTH,
  state: CommentFetchState = { remaining: MAX_COMMENTS }
): Promise<Comment[]> {
  if (!commentIds || commentIds.length === 0 || maxDepth <= 0 || state.remaining <= 0) {
    return [];
  }

  const limitedIds = commentIds.slice(0, state.remaining);
  const items = await getItems(limitedIds);
  const comments: Comment[] = [];

  // Build list of child fetch promises for parallel execution
  const childFetchPromises: Array<{ index: number; promise: Promise<Comment[]> }> = [];

  for (const item of items) {
    if (!item || item.deleted || item.dead || item.type !== 'comment' || !item.text) {
      continue;
    }

    if (state.remaining <= 0) {
      break;
    }

    const comment: Comment = {
      id: item.id,
      author: item.by,
      text: item.text,
      time: item.time,
      children: [],
    };

    state.remaining -= 1;
    comments.push(comment);

    // Check if comment has children
    const hasKids = item.kids && item.kids.length > 0;

    if (hasKids) {
      if (state.remaining > 0 && maxDepth > 1) {
        // Fetch children
        const commentIndex = comments.length - 1;
        childFetchPromises.push({
          index: commentIndex,
          promise: getComments(item.kids, maxDepth - 1, state),
        });
      } else {
        // Mark that children exist but weren't loaded
        comment.hasUnloadedChildren = true;
      }
    }

    if (state.remaining <= 0) {
      break;
    }
  }

  // Fetch all children in parallel
  if (childFetchPromises.length > 0) {
    const childResults = await Promise.all(childFetchPromises.map((p) => p.promise));
    childFetchPromises.forEach((fetch, i) => {
      comments[fetch.index].children = childResults[i];
    });
  }

  return comments;
}

/**
 * Fetch a story with all its comments
 */
export async function getStoryWithComments(
  storyId: number,
  depth?: number
): Promise<{
  story: Story | null;
  comments: Comment[];
}> {
  const story = await getStory(storyId);

  if (!story) {
    return { story: null, comments: [] };
  }

  const storyItem = await getItem(storyId);
  const commentIds = storyItem?.kids || [];

  const effectiveDepth = depth ?? MAX_DEPTH;
  const comments = await getComments(commentIds, effectiveDepth, { remaining: MAX_COMMENTS });

  return { story, comments };
}

/**
 * Fetch replies for a specific comment
 */
export async function getCommentReplies(
  commentId: number,
  depth: number = MAX_DEPTH
): Promise<Comment[]> {
  const item = await getItem(commentId);

  if (!item || item.type !== 'comment' || !item.kids || item.kids.length === 0) {
    return [];
  }

  return getComments(item.kids, depth, { remaining: MAX_COMMENTS });
}
