import { Comment as CommentType } from '@/types';
import Comment from './Comment';

interface CommentTreeProps {
  comments: CommentType[];
  storyId: number;
}

export default function CommentTree({ comments, storyId }: CommentTreeProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} storyId={storyId} />
      ))}
    </div>
  );
}
