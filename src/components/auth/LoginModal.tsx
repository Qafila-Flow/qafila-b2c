"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { X, Phone, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { requestOtp, verifyOtp } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { useOneSignal } from "@/lib/onesignal-context";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp";

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const t = useTranslations("auth");
  const { login } = useAuth();
  const { promptForPush } = useOneSignal();

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhoneNumber("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setLoading(false);
      setCountdown(0);
    }
  }, [open]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const formattedPhone = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+966${phoneNumber.replace(/^0/, "")}`;

  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) return;
    setError("");
    setLoading(true);
    try {
      await requestOtp({ phoneNumber: formattedPhone });
      setStep("otp");
      setCountdown(60);
      // Focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtp({ phoneNumber: formattedPhone, otp: code });
      if (data.user.role !== "CUSTOMER") {
        setError(t("customerOnly"));
        return;
      }
      login(data.accessToken, data.user);
      console.log("ask noi");
      promptForPush();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setLoading(true);
    try {
      await requestOtp({ phoneNumber: formattedPhone });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const code = newOtp.join("");
      if (code.length === 6) handleVerifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    otpRefs.current[nextIdx]?.focus();
    if (pasted.length === 6) handleVerifyOtp(pasted);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-dark shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute end-4 top-4 z-10 rounded-full p-1.5 text-gray-text transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>

        {/* Top - Image placeholder */}
        <div className="h-52 w-full shrink-0 bg-gray-100">
          <Image
            src="/images/login.jpg"
            alt=""
            width={480}
            height={176}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        {/* Bottom - Form */}
        <div className="flex flex-col justify-center px-8 py-8">
          {step === "phone" ? (
            <>
              <h2 className="mb-8 text-center text-xl font-semibold text-dark dark:text-gray-100">
                {t("loginTitle")}
              </h2>

              {/* Phone input */}
              <div className="mb-4">
                <div className="flex items-center gap-2 rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-3 py-3 transition-colors focus-within:border-primary">
                  <Phone size={18} className="shrink-0 text-gray-text" />
                  <span className="shrink-0 text-sm text-gray-text">+966</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRequestOtp();
                    }}
                    placeholder={t("phonePlaceholder")}
                    className="flex-1 text-sm text-dark dark:text-gray-200 bg-transparent outline-none"
                    autoFocus
                  />
                </div>
                {error && <p className="mt-2 text-xs text-discount">{error}</p>}
              </div>

              <button
                onClick={handleRequestOtp}
                disabled={loading || !phoneNumber.trim()}
                className="mb-3 w-full rounded-lg bg-dark py-3 text-sm font-semibold text-white transition-colors hover:bg-dark/90 disabled:opacity-50"
              >
                {loading ? t("sending") : t("continue")}
              </button>

              {/* Divider */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-border" />
                <span className="text-xs text-gray-text">{t("or")}</span>
                <div className="h-px flex-1 bg-gray-border" />
              </div>

              {/* Social buttons */}
              <button className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-border dark:border-gray-700 py-3 text-sm font-medium text-dark dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                {t("continueGoogle")}
              </button>

              <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-border dark:border-gray-700 py-3 text-sm font-medium text-dark dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path d="M17.05 12.79c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.08 1.35 10.72.9 1.29 1.96 2.74 3.35 2.69 1.35-.05 1.86-.87 3.49-.87 1.62 0 2.08.87 3.5.84 1.45-.02 2.36-1.31 3.24-2.61 1.02-1.5 1.44-2.95 1.47-3.02-.03-.02-2.82-1.08-2.85-4.3zM14.4 4.84c.74-.9 1.24-2.15 1.1-3.4-1.07.05-2.36.72-3.13 1.61-.69.79-1.29 2.06-1.13 3.28 1.19.09 2.41-.61 3.16-1.49z" />
                </svg>
                {t("continueApple")}
              </button>

              {/* Terms */}
              <p className="text-center text-[11px] leading-relaxed text-gray-text">
                {t("termsText")}
              </p>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="mb-4 flex items-center gap-1 text-sm text-gray-text transition-colors hover:text-dark"
              >
                <ArrowLeft size={16} />
                {t("back")}
              </button>

              <h2 className="mb-2 text-xl font-semibold text-dark dark:text-gray-100">
                {t("verifyTitle")}
              </h2>
              <p className="mb-8 text-sm text-gray-text">
                {t("otpSentTo", { phone: formattedPhone })}
              </p>

              {/* OTP inputs */}
              <div
                className="mb-4 flex justify-center gap-3"
                dir="ltr"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-12 w-12 rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark text-dark dark:text-gray-100 text-center text-lg font-semibold outline-none transition-colors focus:border-primary"
                  />
                ))}
              </div>

              {error && (
                <p className="mb-4 text-center text-xs text-discount">
                  {error}
                </p>
              )}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.join("").length !== 6}
                className="mb-4 w-full rounded-lg bg-dark py-3 text-sm font-semibold text-white transition-colors hover:bg-dark/90 disabled:opacity-50"
              >
                {loading ? t("verifying") : t("verify")}
              </button>

              <p className="text-center text-sm text-gray-text">
                {t("didntReceive")}{" "}
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="font-medium text-primary disabled:text-gray-text"
                >
                  {countdown > 0
                    ? t("resendIn", { seconds: String(countdown) })
                    : t("resend")}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
