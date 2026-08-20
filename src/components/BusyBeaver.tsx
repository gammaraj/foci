export const FOCI_BEAVER_SRC = "/images/busy-beaver-stud.png";
export const BUSY_BEAVER_NAME = "Busy";

interface BusyBeaverProps {
  alt?: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

/** Busy the Beaver — Foci mascot. Use on error, 404, about, and empty states. */
export function BusyBeaver({
  alt = "Busy the Beaver",
  size = 128,
  className = "",
  priority = false,
}: BusyBeaverProps) {
  return (
    // Native img so replacing the file is never stuck behind next/image's optimizer cache.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FOCI_BEAVER_SRC}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain drop-shadow-sm ${className}`.trim()}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
