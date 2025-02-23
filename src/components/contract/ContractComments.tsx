
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

interface ContractCommentsProps {
  comments: Comment[];
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onAddComment: () => void;
}

export function ContractComments({
  comments,
  newComment,
  onNewCommentChange,
  onAddComment,
}: ContractCommentsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            className="flex-1"
          />
          <Button onClick={onAddComment}>
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </div>
        <div className="space-y-4 mt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{comment.userName}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
