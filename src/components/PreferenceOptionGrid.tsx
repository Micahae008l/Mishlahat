import { motion } from "framer-motion";

type Option<T extends string> = { value: T; title: string; subtitle: string };

type Props<T extends string> = {
  options: Option<T>[];
  selected: T | "";
  onSelect: (value: T) => void;
  columnsClass?: string;
};

export function PreferenceOptionGrid<T extends string>({
  options,
  selected,
  onSelect,
  columnsClass = "grid-cols-1 sm:grid-cols-2",
}: Props<T>) {
  return (
    <div className={`grid gap-3 ${columnsClass}`} dir="rtl" role="group">
      {options.map((opt, idx) => {
        const isOn = selected === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onSelect(opt.value)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 + idx * 0.03 }}
            className={`border px-4 py-4 text-right transition-colors ${
              isOn
                ? "border-primary bg-primary/[0.06] text-primary"
                : "border-iron/30 bg-card text-foreground hover:border-primary/40"
            }`}
          >
            <p className="font-semibold text-foreground">{opt.title}</p>
            <p className="mt-1 text-sm text-dust">{opt.subtitle}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
