"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Reply, Trash2, Send } from "lucide-react";
import { getCommentsAction, createCommentAction, deleteCommentAction } from "@/actions/comments";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    user: { id: string; name: string };
  }[];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentsSection({ marketId }: { marketId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getCommentsAction(marketId).then((res) => {
      setComments(res.comments as Comment[]);
    });
  }, [marketId]);

  async function handlePost() {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    const result = await createCommentAction({ marketId, content: newComment });
    if (result.error) {
      toast.error(result.error);
    } else {
      setNewComment("");
      // Refresh comments
      const res = await getCommentsAction(marketId);
      setComments(res.comments as Comment[]);
    }
    setPosting(false);
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim() || posting) return;
    setPosting(true);
    const result = await createCommentAction({
      marketId,
      content: replyContent,
      parentId,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setReplyTo(null);
      setReplyContent("");
      const res = await getCommentsAction(marketId);
      setComments(res.comments as Comment[]);
    }
    setPosting(false);
  }

  async function handleDelete(commentId: string) {
    const result = await deleteCommentAction(commentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      const res = await getCommentsAction(marketId);
      setComments(res.comments as Comment[]);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment input */}
        {session?.user && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-[var(--color-mint)] text-[var(--color-ink)] text-xs font-bold">
                {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--color-mint)]"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
              />
              <Button
                size="icon"
                className="h-9 w-9 bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[var(--color-mint)]/90 shrink-0"
                onClick={handlePost}
                disabled={!newComment.trim() || posting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Parent comment */}
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-muted text-foreground text-xs">
                      {comment.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{comment.content}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                      {session?.user?.id === comment.user.id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--color-signal)] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply input */}
                {replyTo === comment.id && session?.user && (
                  <div className="ml-10 flex gap-2">
                    <input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--color-mint)]"
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply(comment.id)}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="bg-[var(--color-mint)] text-[var(--color-ink)] hover:bg-[var(--color-mint)]/90"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || posting}
                    >
                      Reply
                    </Button>
                  </div>
                )}

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-10 space-y-3 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="bg-muted text-foreground text-[10px]">
                            {reply.user.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{reply.user.name}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="text-sm mt-0.5 break-words">{reply.content}</p>
                          {session?.user?.id === reply.user.id && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--color-signal)] transition-colors mt-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
