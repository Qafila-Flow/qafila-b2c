import type { StaticImageData } from "next/image";
import TagBadge from "@/components/shared/TagBadge";
import designerEn from "../../../public/images/tags/brand-designer.png";
import designerAr from "../../../public/images/tags/brand-designer-ar.png";
import manufacturerEn from "../../../public/images/tags/brand-manufacturer.png";
import manufacturerAr from "../../../public/images/tags/brand-manufacturer-ar.png";

export type QafilaLabType = "DESIGNER" | "MANUFACTURER";

/** Ready-made badge artwork per specialization and locale — background,
 * rounded corners and internal padding are baked into the PNG, and every badge
 * is drawn to a common height, so the badge only ever needs a height in CSS. */
const BADGES: Record<
  QafilaLabType,
  { en: StaticImageData; ar: StaticImageData }
> = {
  DESIGNER: { en: designerEn, ar: designerAr },
  MANUFACTURER: { en: manufacturerEn, ar: manufacturerAr },
};

interface LabTypeTagProps {
  /** Vendor specialization. When null/undefined the tag renders nothing. */
  type?: QafilaLabType | null;
  /** Localized label for the type (e.g. "Brand Designer"). */
  label: string;
  /** Active locale — selects the Arabic or English artwork. */
  locale: string;
  /** Sizing utilities for the badge. */
  className?: string;
}

/**
 * Badge flagging a Qafila Lab vendor as a Brand Designer or Brand
 * Manufacturer. Used across the listing cards, homepage section, and the
 * brand profile hero. Renders nothing when no specialization is set.
 */
export default function LabTypeTag({
  type,
  label,
  locale,
  className = "h-7 w-auto",
}: LabTypeTagProps) {
  if (!type) return null;

  return (
    <TagBadge
      src={BADGES[type][locale === "ar" ? "ar" : "en"]}
      label={label}
      className={`max-w-full ${className}`}
    />
  );
}
