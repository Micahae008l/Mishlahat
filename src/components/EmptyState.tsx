import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-iron/30 bg-card px-6 py-12 text-center">
      <div className="text-dust/50">
        {icon ?? <Inbox className="h-8 w-8" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-dust">{description}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-2 px-5 py-2 text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
