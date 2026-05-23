import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  /** Tailwind gradient overlay e.g. from-background/90 via-background/40 to-transparent */
  overlayClassName?: string;
  /** Extra classes on the image (object position, etc.) */
  imgClassName?: string;
};

const MAX_RETRIES = 2;

function withRetryParam(url: string, attempt: number): string {
  if (attempt <= 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}mishlahat_retry=${attempt}`;
}

/**
 * Full-bleed photo with gradient overlay.
 * The image is always painted at full opacity (no "invisible until onLoad" — that breaks with cache + SPA).
 * Base gradient stays underneath until pixels arrive; optional retries on hard failures.
 */
export function IdfPhotoBackdrop({ src, alt, overlayClassName, imgClassName }: Props) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    setAttempt(0);
  }, [src]);

  const effectiveSrc = withRetryParam(src, attempt);

  const overlay =
    overlayClassName ??
    "from-background via-background/55 to-background/92 dark:via-background/65";

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-olive/15 via-background to-background">
      {!failed ? (
        <img
          key={`${src}-${attempt}`}
          src={effectiveSrc}
          alt={alt}
          width={1600}
          height={1067}
          className={`h-full w-full object-cover ${imgClassName ?? ""}`}
          onError={() => {
            if (attempt < MAX_RETRIES) setAttempt((a) => a + 1);
            else setFailed(true);
          }}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      ) : null}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${overlay}`} />
    </div>
  );
}
