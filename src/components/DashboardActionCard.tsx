import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";

type Props = {
  to: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "primary" | "default";
};

/** RTL action row: text on the right, arrow on the left */
export function DashboardActionCard({
  to,
  badge,
  title,
  description,
  icon: Icon,
  variant = "default",
}: Props) {
  const primary = variant === "primary";

  return (
    <Link
      to={to}
      dir="rtl"
      className={`group flex flex-row items-center gap-4 p-5 transition-colors sm:p-8 ${
        primary
          ? "border border-primary/30 bg-primary/[0.04] hover:bg-primary/[0.08]"
          : "border border-iron/30 bg-card hover:border-primary/30 hover:bg-primary/[0.04]"
      }`}
    >
      <div className="min-w-0 flex-1 text-right">
        <p
          className={`font-mono text-[10px] tracking-widest uppercase mb-1 ${
            primary ? "text-primary" : "text-dust"
          }`}
        >
          {badge}
        </p>
        <h3 className="flex flex-row items-center justify-end gap-2 text-base font-bold text-foreground sm:text-lg">
          <Icon className={`h-5 w-5 shrink-0 ${primary ? "text-primary" : "text-primary"}`} />
          <span>{title}</span>
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-dust">{description}</p>
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center border transition group-hover:-translate-x-0.5 ${
          primary
            ? "border-primary/30 text-primary"
            : "border-iron/30 text-dust group-hover:border-primary/30 group-hover:text-primary"
        }`}
        aria-hidden
      >
        <ChevronLeft className="h-5 w-5" />
      </div>
    </Link>
  );
}
