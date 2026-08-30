"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useTheme } from "@/lib/theme-context";

interface CredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme: "outline" | "filled_blue" | "filled_black";
      size: "large" | "medium" | "small";
      text: "signin_with" | "signup_with" | "continue_with";
      shape: "rectangular" | "pill";
      logo_alignment: "left" | "center";
      width: number;
      locale: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

/** Load the GIS script once per page, no matter how many buttons mount. */
function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GSI_SRC}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gsi")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(script);
  });
}

interface Props {
  onCredential: (idToken: string) => void;
  onError: () => void;
  disabled?: boolean;
}

/**
 * Google's own rendered button rather than a styled div.
 *
 * Google serves it inside an iframe, so it cannot be restyled - which is the
 * point, since their branding terms require the official mark. `width` has to be
 * a pixel number, so it is measured from the wrapper on mount.
 */
export default function GoogleSignInButton({
  onCredential,
  onError,
  disabled,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);

  // Read through a ref so a re-created callback does not force a re-render of
  // Google's iframe, which would flicker the button.
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    loadGsi()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
            } else {
              onErrorRef.current();
            }
          },
        });

        container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(Math.round(container.offsetWidth) || 360, 400),
          locale,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current();
      });

    return () => {
      cancelled = true;
    };
  }, [locale, theme]);

  // Nothing to render without a client ID - the button would be a dead end.
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div
      className={
        disabled ? "pointer-events-none opacity-50" : undefined
      }
      aria-busy={!ready}
    >
      {/* Google renders into this node; min-height reserves the row so the modal does not jump. */}
      <div ref={containerRef} className="flex min-h-[44px] justify-center" />
    </div>
  );
}
