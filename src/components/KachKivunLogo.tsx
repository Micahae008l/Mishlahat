import { Link } from "@tanstack/react-router";
import { SITE_NAME_HE } from "@/lib/brand";

type Size = "sm" | "md" | "lg";

const textClass: Record<Size, string> = {
  sm: "text-lg font-black tracking-tight sm:text-xl",
  md: "text-xl font-black tracking-tight sm:text-2xl",
  lg: "text-3xl font-black tracking-tight sm:text-4xl",
};

type Props = {
  size?: Size;
  className?: string;
  /** Wrap in link to home */
  linked?: boolean;
  /** Destination when `linked` (default `/`) */
  linkTo?: string;
};

export function KachKivunLogo({ size = "md", className = "", linked = false, linkTo = "/" }: Props) {
  const inner = (
    <span className={`text-primary ${textClass[size]} ${className}`}>{SITE_NAME_HE}</span>
  );

  if (linked) {
    return (
      <Link
        to={linkTo}
        className="rounded-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={linkTo === "/dashboard" ? `${SITE_NAME_HE} — דשבורד` : `${SITE_NAME_HE} — דף הבית`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
