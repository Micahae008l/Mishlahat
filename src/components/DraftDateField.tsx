import { Calendar } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  min?: string;
  max?: string;
  invalid?: boolean;
  className?: string;
};

function formatHebrewDate(iso: string) {
  try {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** Styled draft/recruitment date picker — dark-scheme, visible calendar, Hebrew readout. */
export function DraftDateField({
  value,
  onChange,
  id,
  min = "2000-01-01",
  max = "2038-12-31",
  invalid,
  className = "",
}: Props) {
  const hebrew = value ? formatHebrewDate(value) : null;

  return (
    <div className={`space-y-2 text-right ${className}`.trim()}>
      <div className="relative max-w-sm">
        <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-primary" aria-hidden>
          <Calendar className="h-4 w-4" />
        </span>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          aria-invalid={invalid || undefined}
          className={`input-field input-field--date w-full pr-11${invalid ? " input-field--invalid" : ""}`}
        />
      </div>
      {hebrew ? (
        <p className="font-mono text-xs tabular-nums text-dust" dir="rtl">
          {hebrew}
        </p>
      ) : (
        <p className="text-xs text-dust/70">בחרו תאריך בלוח השנה</p>
      )}
    </div>
  );
}
