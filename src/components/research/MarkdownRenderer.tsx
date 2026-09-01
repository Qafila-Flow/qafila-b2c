"use client";

import { normaliseModelText } from "./sanitize";

interface MarkdownRendererProps {
  content: string;
  /** While true the trailing line may be half-arrived. */
  isStreaming?: boolean;
}

export default function MarkdownRenderer({
  content,
  isStreaming,
}: MarkdownRendererProps) {
  // Escaped whitespace, plus the PDF-only [[chart:N]] markers.
  const normalised = normaliseModelText(content);

  const lines = normalised.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mb-2 mt-4 text-base font-bold text-dark dark:text-gray-100">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++; continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mb-2 mt-5 text-lg font-bold text-primary">
          {parseInline(line.slice(3))}
        </h2>
      );
      i++; continue;
    }

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="mb-3 mt-5 text-xl font-bold text-primary">
          {parseInline(line.slice(2))}
        </h1>
      );
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-4 border-gray-200 dark:border-gray-700" />);
      i++; continue;
    }

    // Table — starts with |
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} rows={tableLines} />);
      continue;
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="mb-3 list-disc space-y-1 ps-5 text-sm text-gray-700 dark:text-gray-300">
          {listItems.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="mb-3 list-decimal space-y-1 ps-5 text-sm text-gray-700 dark:text-gray-300">
          {listItems.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) { i++; continue; }

    // Paragraph
    elements.push(
      <p key={i} className="mb-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className="prose-sm max-w-none">
      {elements}
      {isStreaming && (
        <span className="ms-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
      )}
    </div>
  );
}

// ─── Inline parser ──────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  // Fast path — no markup
  if (!/[*`[\]\\]/.test(text)) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **...**
    const bold = remaining.match(/^([\s\S]*?)\*\*([\s\S]+?)\*\*([\s\S]*)/);
    if (bold) {
      if (bold[1]) parts.push(<span key={key++}>{bold[1]}</span>);
      parts.push(<strong key={key++} className="font-semibold text-dark dark:text-gray-100">{bold[2]}</strong>);
      remaining = bold[3]; continue;
    }

    // Link [text](url)
    const link = remaining.match(/^([\s\S]*?)\[([^\]]+)\]\(([^)]+)\)([\s\S]*)/);
    if (link) {
      if (link[1]) parts.push(<span key={key++}>{link[1]}</span>);
      parts.push(
        <a key={key++} href={link[3]} target="_blank" rel="noopener noreferrer"
          className="text-primary underline hover:opacity-80">
          {link[2]}
        </a>
      );
      remaining = link[4]; continue;
    }

    // Inline code `...`
    const code = remaining.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)/);
    if (code) {
      if (code[1]) parts.push(<span key={key++}>{code[1]}</span>);
      parts.push(
        <code key={key++}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-primary dark:bg-dark/80">
          {code[2]}
        </code>
      );
      remaining = code[3]; continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ─── Table ──────────────────────────────────────────────────────────────────

function MarkdownTable({ rows }: { rows: string[] }) {
  const parseRow = (row: string) =>
    row.split("|").slice(1, -1).map((c) => c.trim());

  if (rows.length < 2) return null;

  // Filter out the separator row (|---|---|)
  const nonSeparator = rows.filter((r) => !/^\s*\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/.test(r));
  if (nonSeparator.length < 1) return null;

  const headers = parseRow(nonSeparator[0]);
  const dataRows = nonSeparator.slice(1).map(parseRow);

  return (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-dark text-white">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-start font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-dark/30" : "bg-gray-50 dark:bg-dark/50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-gray-100 px-3 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
