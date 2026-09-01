/**
 * Cleanup applied to model text before it reaches a chat bubble.
 *
 * Two different problems: the model sometimes emits escaped whitespace and
 * stray tool-call JSON as prose, and the PDF placement markers are meant for
 * the report renderer, never for the reader.
 */

/** Complete `[[chart:3]]` markers, and a partial one still being streamed. */
const CHART_MARKER = /\[\[chart:\d+\]\]/gi;
const PARTIAL_CHART_MARKER = /\[\[?c?h?a?r?t?:?\d*$/i;

/** Safe on a partial stream: only ever removes, never reorders. */
export function normaliseModelText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(CHART_MARKER, "")
    .replace(PARTIAL_CHART_MARKER, "");
}

/**
 * The model occasionally echoes tool-call JSON as plain text. Drops standalone
 * JSON lines and a JSON fragment trailing the message.
 */
export function stripJsonLeakage(text: string): string {
  const normalised = normaliseModelText(text);

  const cleaned = normalised.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return true;
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        JSON.parse(t);
        return false;
      } catch {
        return true;
      }
    }
    return true;
  });

  return cleaned
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[,\s]*\{[^{}]{0,200}\}$/, "")
    .trim();
}
