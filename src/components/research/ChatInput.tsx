"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { useTranslations } from "next-intl";
import TopicPill from "./TopicPill";

const SUGGESTION_CHIPS = [
  "Summary global trade",
  "Deep dive population growth",
  "List generative AI trends",
  "Saudi fashion market size 2026",
];

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
}

export default function ChatInput({ onSend, isStreaming }: ChatInputProps) {
  const t = useTranslations("research");
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-3 dark:border-gray-700 dark:bg-dark">
      <div className="mx-auto max-w-3xl">
        {/* Input row */}
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-600 dark:bg-dark/60">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder={t("chatPlaceholder")}
            className="flex-1 resize-none bg-transparent text-sm text-dark outline-none placeholder:text-gray-400 dark:text-gray-100"
            style={{ minHeight: "24px", maxHeight: "160px" }}
          />
          <button
            onClick={handleSend}
            disabled={!value.trim() || isStreaming}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            aria-label="Send"
          >
            <SendHorizonal size={15} />
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <TopicPill
              key={chip}
              label={chip}
              onClick={(label) => {
                setValue(label);
                textareaRef.current?.focus();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
