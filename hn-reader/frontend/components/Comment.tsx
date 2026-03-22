'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment as CommentType } from '@/types';
import { api } from '@/lib/api';
import { Button } from './ui/Button';

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
  const leftPadding = Math.min(depth * 18, 54);

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
    <div className="py-2.5" style={{ paddingLeft: `${leftPadding}px` }}>
      {/* Comment header */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600 transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          {collapsed ? '+' : '-'}
        </button>
        <span className="font-semibold text-slate-900">{comment.author}</span>
        <span>{timeAgo}</span>
        {replies.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>

      {/* Comment body */}
      {!collapsed && (
        <>
          <div
            className="prose prose-sm card-surface max-w-none p-3 text-gray-800 sm:p-4"
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />

          {/* Load replies button */}
          {hasUnloadedChildren && !loadingReplies && (
            <Button onClick={loadReplies} variant="outline" size="sm" className="mt-2">
              Load replies
            </Button>
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
                className="font-medium underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Nested comments */}
          {replies.length > 0 && (
            <div className="mt-3 border-l-2 border-slate-200 pl-3">
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
