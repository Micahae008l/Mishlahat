import { useEffect, useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const DEFAULT_LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
};

export function OtpInput({
  value,
  onChange,
  length = DEFAULT_LENGTH,
  disabled = false,
  autoFocus = true,
  id: idProp,
  invalid = false,
  describedBy,
}: Props) {
  const groupId = useId();
  const legendId = `${groupId}-legend`;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus once on mount
  }, []);

  function focusAt(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    return clean;
  }

  function applyDigits(nextDigits: string[]) {
    commit(nextDigits.join(""));
  }

  function handleDigitChange(index: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (only.length > 1) {
      const clean = commit(only);
      focusAt(Math.min(clean.length, length - 1));
      return;
    }

    const next = [...digits];
    next[index] = only;
    applyDigits(next);

    if (only && index < length - 1) {
      focusAt(index + 1);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        applyDigits(next);
      } else if (index > 0) {
        e.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        applyDigits(next);
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      focusAt(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      focusAt(length - 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const clean = commit(e.clipboardData.getData("text"));
    focusAt(Math.min(clean.length, length - 1));
  }

  return (
    <fieldset
      id={idProp ?? groupId}
      className="border-0 p-0 m-0"
      disabled={disabled}
      aria-labelledby={legendId}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    >
      <legend id={legendId} className="sr-only">
        קוד אימות בן {length} ספרות
      </legend>
      <div dir="ltr" className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-2 sm:gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`ספרה ${index + 1} מתוך ${length}`}
            className={`input-field input-field--otp h-12 font-mono text-xl font-bold tabular-nums sm:h-14 sm:text-2xl${invalid ? " input-field--invalid" : ""}`}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            onPaste={handlePaste}
          />
        ))}
      </div>
    </fieldset>
  );
}
