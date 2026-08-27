"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/api/users";

/**
 * The one field Tamara needs that OTP-by-phone signup never collects.
 *
 * Qafila authenticates by phone, so `User.email` is optional and a long-standing
 * customer may have none. Tamara requires one - it emails the instalment
 * schedule and the payment reminders - and there is no honest fallback:
 * synthesising `<phone>@qafila.sa` would turn a missed instalment into a
 * collections problem.
 *
 * Rendered inline inside the selected Tamara option rather than as a modal or a
 * separate route: the customer is mid-payment, and a route change loses the
 * selection. On success the cached user is patched so a reload does not ask
 * again, and the caller retries the payment automatically.
 */

interface TamaraEmailStepProps {
  onSaved: () => void;
}

export default function TamaraEmailStep({ onSaved }: TamaraEmailStepProps) {
  const t = useTranslations();
  const { user, updateUser } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Same shape the backend's @IsEmail() will accept, so the round trip is not
  // the first feedback the customer gets.
  const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const save = async () => {
    const trimmed = email.trim();
    if (!looksValid) {
      setError(t("payment.emailInvalid"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProfile({ email: trimmed });
      // React state AND localStorage, or the next mount reads the stale copy.
      updateUser({ email: trimmed });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("payment.emailSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-border dark:border-gray-700 bg-light-bg dark:bg-gray-900/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Mail size={16} className="text-primary" />
        <p className="text-sm font-semibold text-dark dark:text-gray-100">
          {t("payment.emailRequiredTitle")}
        </p>
      </div>

      {/* The reason, not just a label. An unexplained email field at the payment
          step reads as a marketing capture and gets abandoned. */}
      <p className="mb-3 text-xs text-gray-text">
        {t("payment.emailRequiredBody")}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") void save();
          }}
          placeholder={t("payment.emailPlaceholder")}
          aria-label={t("payment.emailRequiredTitle")}
          aria-invalid={Boolean(error)}
          className="flex-1 rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-3 py-2 text-sm text-dark dark:text-gray-100 outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !looksValid}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? t("payment.emailSaving") : t("payment.emailSave")}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-discount">{error}</p>}
    </div>
  );
}
