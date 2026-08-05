import Image, { type StaticImageData } from "next/image";

/**
 * Renders a ready-made badge image (product tags, Qafila Lab types).
 *
 * The artwork is a self-contained pill — background, rounded corners and
 * internal padding are baked into the PNG — so this only renders it: the
 * caller owns sizing through `className` (e.g. `h-7 w-auto`, or `w-full
 * h-auto` to size off the container). Never wrap it in a border, background
 * or extra pill.
 *
 * `src` is a static import, so its intrinsic size comes along for free and the
 * emitted URL is content-hashed and immutable — updated artwork can never be
 * served from a stale image-optimizer or browser cache.
 */
export default function TagBadge({
  src,
  label,
  className = "h-7 w-auto",
}: {
  src: StaticImageData;
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
      className={`object-contain ${className}`}
    />
  );
}
