import Image from "next/image";

/**
 * Renders a ready-made badge image (product tags, Qafila Lab types).
 *
 * The artwork is a self-contained pill — background, rounded corners and
 * internal padding are baked into the PNG — so this only renders it: the
 * caller owns sizing through `className` (e.g. `h-7 w-auto`, or `w-full
 * h-auto` to size off the container). Never wrap it in a border, background
 * or extra pill.
 */
export default function TagBadge({
  src,
  width,
  height,
  label,
  className = "h-7 w-auto",
}: {
  src: string;
  width: number;
  height: number;
  /** Localized name — used as alt text and hover tooltip. */
  label: string;
  /** Sizing utilities (plus any extra classes) — the caller sets both axes,
   * one of them `auto`, so the badge keeps its ratio. */
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={label}
      title={label}
      width={width}
      height={height}
      className={`object-contain ${className}`}
    />
  );
}
