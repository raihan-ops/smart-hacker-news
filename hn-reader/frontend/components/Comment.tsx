'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment as CommentType } from '@/types';
import { api } from '@/lib/api';

interface CommentProps {
  comment: CommentType;
  storyId: number;
  depth?: number;
}

export default function Comment({ comment, storyId, depth = 0 }: CommentProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>(comment.children);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [hasUnloadedChildren, setHasUnloadedChildren] = useState(comment.hasUnloadedChildren || false);
  const [error, setError] = useState<string | null>(null);

  const timeAgo = formatDistanceToNow(new Date(comment.time * 1000), { addSuffix: true });
  const indentClass = depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : '';

  const loadReplies = async () => {
    try {
      setLoadingReplies(true);
      setError(null);
      const data = await api.getCommentReplies(storyId, comment.id, 1);
      setReplies(data.replies);
      setHasUnloadedChildren(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  return (
    <div className={`py-3 ${indentClass}`}>
      {/* Comment header */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="font-medium hover:text-orange-500 transition-colors"
        >
          {collapsed ? '[+]' : '[-]'}
        </button>
        <span className="font-medium">{comment.author}</span>
        <span>{timeAgo}</span>
      </div>

      {/* Comment body */}
      {!collapsed && (
        <>
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />

          {/* Load replies button */}
          {hasUnloadedChildren && !loadingReplies && (
            <button
              onClick={loadReplies}
              className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Load replies
            </button>
          )}

          {/* Loading state */}
          {loadingReplies && (
            <div className="mt-2 text-sm text-gray-500">Loading replies...</div>
          )}

          {/* Error state */}
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}{' '}
              <button
                onClick={loadReplies}
                className="underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Nested comments */}
          {replies.length > 0 && (
            <div className="mt-3">
              {replies.map((child) => (
                <Comment key={child.id} comment={child} storyId={storyId} depth={depth + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
