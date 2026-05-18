"use client";

import { useEffect, useState } from "react";

interface Options {
  typingSpeed?: number;
  deletingSpeed?: number;
  holdAfterTyped?: number;
  holdAfterDeleted?: number;
  enabled?: boolean;
}

export function useTypewriterPlaceholder(
  words: readonly string[],
  {
    typingSpeed = 90,
    deletingSpeed = 45,
    holdAfterTyped = 1600,
    holdAfterDeleted = 350,
    enabled = true,
  }: Options = {},
) {
  // A content-derived key — when the list content actually changes (e.g.,
  // the user flips the app locale) we want a clean restart, not a smudge
  // of half-typed characters from the previous list.
  const key = words.join("|");

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<
    "typing" | "holding" | "deleting" | "pausing"
  >("typing");

  // Reset during render when the words list content changes — the
  // React-recommended alternative to setting state inside an effect.
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setText("");
    setWordIndex(0);
    setPhase("typing");
  }

  useEffect(() => {
    if (!enabled || words.length === 0) return;
    const current = words[wordIndex % words.length];

    let delay: number;
    switch (phase) {
      case "typing":
        delay = text.length < current.length ? typingSpeed : holdAfterTyped;
        break;
      case "holding":
        delay = holdAfterTyped;
        break;
      case "deleting":
        delay = text.length > 0 ? deletingSpeed : holdAfterDeleted;
        break;
      case "pausing":
        delay = holdAfterDeleted;
        break;
    }

    const timer = window.setTimeout(() => {
      if (phase === "typing") {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          setPhase("holding");
        }
      } else if (phase === "holding") {
        setPhase("deleting");
      } else if (phase === "deleting") {
        if (text.length > 0) {
          setText(current.slice(0, text.length - 1));
        } else {
          setPhase("pausing");
        }
      } else if (phase === "pausing") {
        setWordIndex((i) => (i + 1) % words.length);
        setPhase("typing");
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    text,
    phase,
    wordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    holdAfterTyped,
    holdAfterDeleted,
    enabled,
  ]);

  return text;
}
