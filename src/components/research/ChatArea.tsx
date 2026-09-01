"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import ChatMessage, { Message } from "./ChatMessage";

interface ChatAreaProps {
  messages: Message[];
  onRetry?: (failedId: string) => void;
}

/** Within this many pixels of the bottom still counts as "following along". */
const STICK_THRESHOLD = 120;

export default function ChatArea({ messages, onRetry }: ChatAreaProps) {
  const t = useTranslations("research");
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPinned(distance <= STICK_THRESHOLD);
  }, []);

  /*
   * Follow the stream only while the reader is already at the bottom. A report
   * now runs to several screens, and scrolling up to re-read something used to
   * be undone by the very next token.
   */
  useEffect(() => {
    if (!pinned) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pinned]);

  const jumpToLatest = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setPinned(true);
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRetry={onRetry ? () => onRetry(msg.id) : undefined}
            />
          ))}
        </div>
      </div>

      {!pinned && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-lg transition-opacity hover:opacity-90"
        >
          <ArrowDown size={13} />
          {t("jumpToLatest")}
        </button>
      )}
    </div>
  );
}
