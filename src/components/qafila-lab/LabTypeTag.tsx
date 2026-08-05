import type { StaticImageData } from "next/image";
import TagBadge from "@/components/shared/TagBadge";
import designerBadge from "../../../public/images/tags/brand-designer.png";
import manufacturerBadge from "../../../public/images/tags/brand-manufacturer.png";

export type QafilaLabType = "DESIGNER" | "MANUFACTURER";

/** Ready-made badge artwork per specialization — background, rounded corners
 * and internal padding are baked into the PNG, so the badge is only sized.
 * Both share one 1160×240 canvas with identical padding, so the two render at
 * exactly the same size. */
const BADGES: Record<QafilaLabType, StaticImageData> = {
  DESIGNER: designerBadge,
  MANUFACTURER: manufacturerBadge,
};

interface LabTypeTagProps {
  /** Vendor specialization. When null/undefined the tag renders nothing. */
  type?: QafilaLabType | null;
  /** Localized label for the type (e.g. "Brand Designer"). */
  label: string;
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
  className = "h-7 w-auto",
}: LabTypeTagProps) {
  if (!type) return null;

  return (
    <TagBadge
      src={BADGES[type]}
      label={label}
      className={`max-w-full ${className}`}
    />
  );
}
