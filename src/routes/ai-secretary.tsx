import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { MATCH_TOOL_NAME, SECRETARY_NAME, SECRETARY_COMING } from "@/lib/voice";

export const Route = createFileRoute("/ai-secretary")({
  component: AiSecretaryPage,
  head: () => ({
    meta: [
      { title: `${SECRETARY_NAME} | קח כיוון` },
      { name: "description", content: `${SECRETARY_NAME} — שאלות על גיוס ופרופיל. ${SECRETARY_COMING}` },
    ],
  }),
});

const ease = [0.16, 1, 0.3, 1] as const;

function AiSecretaryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 topo-lines" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="border border-iron/30 bg-card p-8 text-right sm:p-10"
      >
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-primary/30 text-primary">
          <Inbox className="h-6 w-6" aria-hidden />
        </div>
        <p className="eyebrow eyebrow-accent mb-2">{SECRETARY_NAME}</p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{SECRETARY_COMING}</h1>
        <p className="mt-3 text-sm leading-[1.7] text-dust">
          רוצים לשאול שאלה על גיוס, פרופיל או תהליך — בלי לחפש בפורומים. המזכירה תענה
          בשיחה רגילה, בעברית. עדיין בונים את זה.
        </p>
        <p className="mt-4 text-sm text-dust">
          עכשיו אפשר להריץ את{" "}
          <Link to="/ai-counselor" className="font-semibold text-primary hover:underline">
            {MATCH_TOOL_NAME}
          </Link>{" "}
          אחרי שמילאתם פרופיל.
        </p>
        <Link to="/ai-counselor" className="btn-primary mt-8">
          ל{MATCH_TOOL_NAME}
        </Link>
      </motion.div>
    </div>
  );
}
