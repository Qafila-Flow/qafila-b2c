"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Loader2, RotateCcw } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import SourceCitation from "./SourceCitation";
import PdfDownloadButton from "./PdfDownloadButton";
import { Source } from "@/lib/api/ai-research";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  sources?: Source[];
  pdfId?: string;
  pdfDownloadUrl?: string;
  toolActivity?: { tool: string; query: string }[];
  error?: string;
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

/** Tool names are internal; the reader gets the activity they describe. */
const TOOL_LABELS: Record<string, string> = {
  web_search: "searching",
  qafila_statistics: "readingStats",
  qafila_products: "readingCatalog",
  qafila_vendors: "readingVendors",
  qafila_categories: "readingCategories",
  generate_pdf: "buildingReport",
};

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const t = useTranslations("research");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [message.content]);

  const activity = message.toolActivity ?? [];
  const hasBody = message.content.trim().length > 0;

  return (
    <div className={`flex w-full gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? "bg-primary text-white"
            : "bg-gray-200 text-dark dark:bg-gray-700 dark:text-gray-100"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble - a report needs the width, a question does not */}
      <div
        className={`group rounded-2xl px-4 py-3 ${
          isUser
            ? "max-w-[80%] rounded-tr-sm bg-primary/10 dark:bg-primary/20"
            : "min-w-0 flex-1 rounded-tl-sm bg-white shadow-sm dark:bg-dark/60"
        }`}
      >
        {/* What the agent is doing, collapsed to one line per distinct step */}
        {!isUser && activity.length > 0 && (
          <div className="mb-2.5 space-y-1 border-s-2 border-primary/30 ps-2.5">
            {activity.map((a, i) => {
              const isLast = i === activity.length - 1;
              const running = Boolean(message.isStreaming) && isLast;
              const key = TOOL_LABELS[a.tool];
              return (
                <div
                  key={`${a.tool}-${i}`}
                  className="flex items-center gap-1.5 text-xs text-gray-400"
                >
                  {running ? (
                    <Loader2 size={11} className="shrink-0 animate-spin text-primary" />
                  ) : (
                    <Check size={11} className="shrink-0 text-primary/70" />
                  )}
                  <span className="truncate">
                    {key ? t(`tool.${key}`) : a.tool}
                    {a.query ? (
                      <span className="text-gray-500"> - {a.query}</span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm text-dark dark:text-gray-100">
            {message.content}
          </p>
        ) : message.error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">{message.error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
              >
                <RotateCcw size={12} />
                {t("retry")}
              </button>
            )}
          </div>
        ) : message.isStreaming && !hasBody ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </div>
        ) : (
          /*
           * Rendered as markdown while it streams too. It used to arrive as raw
           * text and reflow into headings and tables at the end, which on a
           * report-length answer is a page-long flicker.
           */
          <MarkdownRenderer
            content={message.content}
            isStreaming={message.isStreaming}
          />
        )}

        {/* Sources */}
        {!isUser && !message.isStreaming && (message.sources?.length ?? 0) > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-700">
            <p className="mb-1.5 text-xs font-medium text-gray-400">{t("sources")}</p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources!.map((src, i) => (
                <SourceCitation key={i} {...src} />
              ))}
            </div>
          </div>
        )}

        {/* PDF download */}
        {!isUser && !message.isStreaming && message.pdfDownloadUrl && (
          <PdfDownloadButton
            title="Qafila Research Report"
            content={message.content}
            pdfId={message.pdfId}
            downloadUrl={message.pdfDownloadUrl}
          />
        )}

        {/* Copy - a research answer is meant to be taken elsewhere */}
        {!isUser && !message.isStreaming && !message.error && hasBody && (
          <button
            onClick={handleCopy}
            className={`mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-opacity hover:text-gray-200 ${
              copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            dir={isRtl ? "rtl" : "ltr"}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t("copied") : t("copy")}
          </button>
        )}
      </div>
    </div>
  );
}
