import TagBadge from "@/components/shared/TagBadge";

export type QafilaLabType = "DESIGNER" | "MANUFACTURER";

/** Ready-made badge artwork per specialization — background, rounded corners
 * and internal padding are baked into the PNG, so the badge is only sized.
 * Both share one 1160×240 canvas with identical padding, so the two render at
 * exactly the same size. */
const BADGE_SIZE = { width: 1160, height: 240 };
const BADGE_SRC: Record<QafilaLabType, string> = {
  DESIGNER: "/images/tags/brand-designer.png",
  MANUFACTURER: "/images/tags/brand-manufacturer.png",
};

interface LabTypeTagProps {
  /** Vendor specialization. When null/undefined the tag renders nothing. */
  type?: QafilaLabType | null;
  /** Localized label for the type (e.g. "Brand Designer"). */
  label: string;
  /** Height utility for the badge (width follows automatically). */
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
      src={BADGE_SRC[type]}
      width={BADGE_SIZE.width}
      height={BADGE_SIZE.height}
      label={label}
      className={`max-w-full ${className}`}
    />
  );
}
