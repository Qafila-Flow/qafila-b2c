"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, Send, Trash2, Pencil, CornerDownRight, Loader2 } from "lucide-react";
import {
  getStoryComments,
  createStoryComment,
  deleteStoryComment,
  updateStoryComment,
} from "@/lib/api/stories";
import { useAuth } from "@/lib/auth-context";
import type { StoryComment } from "@/types/story";

interface StoryCommentsProps {
  storyId: string;
  onClose: () => void;
}

export default function StoryComments({ storyId, onClose }: StoryCommentsProps) {
  const t = useTranslations("stories");
  const { isLoggedIn, user } = useAuth();

  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<StoryComment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = async (p: number, append = false) => {
    try {
      const res = await getStoryComments(storyId, p, 20);
      setComments((prev) => (append ? [...prev, ...res.data] : res.data));
      setHasMore(res.meta.hasNextPage);
    } catch {
      // API unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [storyId]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || !isLoggedIn) return;
    setSubmitting(true);
    try {
      const newComment = await createStoryComment(
        storyId,
        trimmed,
        replyTo?.id,
      );
      if (replyTo) {
        // Add reply inline under the parent
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setText("");
      setReplyTo(null);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, parentId: string | null) => {
    try {
      await deleteStoryComment(commentId);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
              : c,
          ),
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // silently fail
    }
  };

  const handleUpdate = async (commentId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      const updated = await updateStoryComment(commentId, trimmed);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, content: updated.content };
          if (c.replies?.length) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, content: updated.content } : r,
              ),
            };
          }
          return c;
        }),
      );
      setEditingId(null);
      setEditText("");
    } catch {
      // silently fail
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next, true);
  };

  const startReply = (comment: StoryComment) => {
    setReplyTo(comment);
    setEditingId(null);
    inputRef.current?.focus();
  };

  const startEdit = (comment: StoryComment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
    setReplyTo(null);
  };

  const timeSince = (dateStr: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
    if (seconds < 60) return t("justNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { count: hours });
    return t("daysAgo", { count: Math.floor(hours / 24) });
  };

  const renderComment = (comment: StoryComment, isReply = false) => {
    const isOwn = user?.id === comment.userId;

    return (
      <div key={comment.id} className={`${isReply ? "ms-6" : ""}`}>
        <div className="group flex gap-2 py-2">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-dark">
            {comment.user.firstName?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-dark">
                {comment.user.firstName ?? "User"} {comment.user.lastName ?? ""}
              </span>
              <span className="text-[10px] text-gray-text">
                {timeSince(comment.createdAt)}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(comment.id)}
                  className="flex-1 rounded border border-gray-border px-2 py-1 text-xs outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(comment.id)}
                  className="text-xs font-medium text-primary"
                >
                  {t("save")}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-text"
                >
                  {t("cancel")}
                </button>
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-dark/80">{comment.content}</p>
            )}

            {/* Actions */}
            {editingId !== comment.id && (
              <div className="mt-1 flex items-center gap-3">
                {isLoggedIn && !isReply && (
                  <button
                    onClick={() => startReply(comment)}
                    className="flex items-center gap-0.5 text-[10px] font-medium text-gray-text hover:text-primary"
                  >
                    <CornerDownRight size={10} />
                    {t("reply")}
                  </button>
                )}
                {isOwn && (
                  <>
                    <button
                      onClick={() => startEdit(comment)}
                      className="flex items-center gap-0.5 text-[10px] text-gray-text hover:text-primary"
                    >
                      <Pencil size={10} />
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id, comment.parentId)}
                      className="flex items-center gap-0.5 text-[10px] text-gray-text hover:text-discount"
                    >
                      <Trash2 size={10} />
                      {t("delete")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-border px-4 py-3">
        <h3 className="text-sm font-bold text-dark">{t("comments")}</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-text hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-gray-text" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-text">
            {t("noComments")}
          </p>
        ) : (
          <>
            {comments.map((c) => renderComment(c))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-2 text-center text-xs font-medium text-primary"
              >
                {t("loadMore")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Input */}
      {isLoggedIn ? (
        <div className="border-t border-gray-border px-4 py-3">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-text">
              <CornerDownRight size={10} />
              <span>
                {t("replyingTo")} {replyTo.user.firstName}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-text hover:text-dark"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t("writeComment")}
              className="flex-1 rounded-full border border-gray-border bg-gray-light px-4 py-2 text-xs outline-none transition-colors focus:border-primary"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="rounded-full bg-primary p-2 text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-border px-4 py-3 text-center text-xs text-gray-text">
          {t("loginToComment")}
        </div>
      )}
    </div>
  );
}
