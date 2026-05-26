import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/brand/mishlahat-logo.png?url";
import { SITE_NAME_HE } from "@/lib/brand";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, { img: string; text: string; gap: string }> = {
  sm: { img: "h-8 w-8", text: "text-sm", gap: "gap-1.5" },
  md: { img: "h-10 w-10", text: "text-base", gap: "gap-2" },
  lg: { img: "h-14 w-14", text: "text-lg", gap: "gap-2.5" },
};

type Props = {
  size?: Size;
  showWordmark?: boolean;
  className?: string;
  /** Wrap in link to home */
  linked?: boolean;
};

export const MISHLAHAT_LOGO_URL = logoUrl;

export function MishlahatLogo({
  size = "md",
  showWordmark = true,
  className = "",
  linked = false,
}: Props) {
  const s = sizeClass[size];
  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <img
        src={logoUrl}
        alt={`לוגו ${SITE_NAME_HE}`}
        width={56}
        height={56}
        className={`${s.img} shrink-0 object-contain`}
        decoding="async"
      />
      {showWordmark ? (
        <span className={`font-bold tracking-tight text-primary ${s.text}`}>{SITE_NAME_HE}</span>
      ) : null}
    </span>
  );

  if (linked) {
    return (
      <Link
        to="/"
        className="rounded-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={`${SITE_NAME_HE} — דף הבית`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
