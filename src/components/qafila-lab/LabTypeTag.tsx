import TagBadge from "@/components/shared/TagBadge";

export type QafilaLabType = "DESIGNER" | "MANUFACTURER";

/** Ready-made badge artwork per specialization — background, rounded corners
 * and internal padding are baked into the PNG, so the badge is only sized. */
const BADGES: Record<QafilaLabType, { src: string; width: number; height: number }> = {
  DESIGNER: {
    src: "/images/tags/brand-designer.png",
    width: 940,
    height: 240,
  },
  MANUFACTURER: {
    src: "/images/tags/brand-manufacturer.png",
    width: 1049,
    height: 240,
  },
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
  className = "h-7",
}: LabTypeTagProps) {
  if (!type) return null;

  const badge = BADGES[type];

  return (
    <TagBadge
      src={badge.src}
      width={badge.width}
      height={badge.height}
      label={label}
      className={className}
    />
  );
}
