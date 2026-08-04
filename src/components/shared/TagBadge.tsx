import Image from "next/image";

/**
 * Renders a ready-made badge image (product tags, Qafila Lab types).
 *
 * The artwork is a self-contained pill — background, rounded corners and
 * internal padding are baked into the PNG — so this only sizes it: the caller
 * sets the height through `className` (e.g. `h-7`) and the width follows the
 * intrinsic ratio. Never wrap it in a border, background or extra pill.
 */
export default function TagBadge({
  src,
  width,
  height,
  label,
  className = "h-7",
}: {
  src: string;
  width: number;
  height: number;
  /** Localized name — used as alt text and hover tooltip. */
  label: string;
  /** Height utility (plus any extra classes). Width stays automatic. */
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={label}
      title={label}
      width={width}
      height={height}
      className={`w-auto shrink-0 object-contain ${className}`}
    />
  );
}
