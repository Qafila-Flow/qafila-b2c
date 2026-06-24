import { Gem, Factory } from "lucide-react";

export type QafilaLabType = "DESIGNER" | "MANUFACTURER";

interface LabTypeTagProps {
  /** Vendor specialization. When null/undefined the tag renders nothing. */
  type?: QafilaLabType | null;
  /** Localized label for the type (e.g. "Brand Designer"). */
  label: string;
  /** `light` for white cards, `dark` for the gold-on-dark surfaces. */
  variant?: "light" | "dark";
  className?: string;
}

const styles: Record<NonNullable<LabTypeTagProps["variant"]>, string> = {
  light:
    "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-700",
  dark: "border-amber-400/30 bg-amber-500/15 text-amber-200 backdrop-blur",
};

/**
 * Elegant premium tag flagging a Qafila Lab vendor as a Brand Designer or
 * Brand Manufacturer. Used across the listing cards, homepage section, and
 * the brand profile hero. Renders nothing when no specialization is set.
 */
export default function LabTypeTag({
  type,
  label,
  variant = "light",
  className = "",
}: LabTypeTagProps) {
  if (!type) return null;

  const Icon = type === "DESIGNER" ? Gem : Factory;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[variant]} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
