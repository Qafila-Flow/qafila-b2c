"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Script from "next/script";
import { getBnplWidget } from "@/lib/api/payments";

/**
 * Tamara's official promotional widget.
 *
 * Replaces the hand-written "split in 4" boxes, which computed `price / 4`
 * locally and so kept claiming instalments for baskets Tamara would refuse.
 * The widget asks Tamara what this amount is actually eligible for, and Tamara
 * requires their component be used as shipped rather than restyled.
 *
 * Renders nothing at all when the deployment has no widget key.
 */

declare global {
  interface Window {
    tamaraWidgetConfig?: {
      lang: string;
      country: string;
      publicKey: string;
    };
    TamaraWidgetV2?: { refresh: () => void };
  }
}

// React 19 keeps JSX in the react module, so the custom element is declared
// there rather than on the old global JSX namespace. A namespace is the only
// shape TypeScript accepts for this augmentation.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "tamara-widget": {
        type: string;
        "inline-type"?: string;
        amount?: string;
        children?: React.ReactNode;
      };
    }
  }
}

interface TamaraWidgetProps {
  /** SAR, gross. The number the customer would actually pay. */
  amount: number;
  /** Tamara's layout variants. 2 is the standard inline summary. */
  inlineType?: "2" | "4" | "5";
  className?: string;
}

export default function TamaraWidget({
  amount,
  inlineType = "2",
  className,
}: TamaraWidgetProps) {
  const locale = useLocale();
  const [publicKey, setPublicKey] = useState<string>("");
  // Sandbox and live widgets come from different CDNs, and a key only resolves
  // on its own. The API knows which environment it is pointed at; we do not.
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [painted, setPainted] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getBnplWidget()
      .then((cfg) => {
        if (cancelled) return;
        setPublicKey(cfg.enabled ? cfg.publicKey : "");
        setScriptUrl(cfg.scriptUrl);
      })
      // Promotional only. A config it cannot read means no widget, never a
      // broken product page.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Must exist before the script runs, and must be re-read when the shopper
  // switches language — hence refresh() rather than a remount.
  useEffect(() => {
    if (!publicKey) return;
    window.tamaraWidgetConfig = {
      lang: locale === "ar" ? "ar" : "en",
      country: "SA",
      publicKey,
    };
    window.TamaraWidgetV2?.refresh();
  }, [publicKey, locale, amount]);

  /**
   * The widget paints into a shadow root, and stays empty whenever Tamara has
   * nothing to say — an amount outside their limits, a key with no published
   * config, a blocked script. An empty styled box is worse than no box, so the
   * wrapper stays hidden until there is something in it.
   */
  useEffect(() => {
    if (!publicKey) return;
    const el = host.current?.querySelector("tamara-widget");
    if (!el) return;

    const timer = setInterval(() => {
      const has = (el.shadowRoot?.textContent ?? "").trim().length > 0;
      setPainted(has);
      if (has) clearInterval(timer);
    }, 300);
    const giveUp = setTimeout(() => clearInterval(timer), 8000);
    return () => {
      clearInterval(timer);
      clearTimeout(giveUp);
    };
  }, [publicKey, locale, amount]);

  if (!publicKey || !scriptUrl) return null;

  return (
    // Collapsed rather than `display: none` while it waits: the element has to
    // stay laid out for the widget to paint into it, or this never resolves.
    <div
      ref={host}
      className={painted ? className : undefined}
      style={
        painted
          ? undefined
          : { height: 0, overflow: "hidden", visibility: "hidden" }
      }
    >
      <Script id="tamara-widget" src={scriptUrl} strategy="afterInteractive" />
      {/* Tamara's custom element. It renders its own logo and copy. */}
      <tamara-widget
        type="tamara-summary"
        inline-type={inlineType}
        amount={amount.toFixed(2)}
      />
    </div>
  );
}
