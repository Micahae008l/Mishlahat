import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, type YomHameah } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { dashboardQueryOptions } from "@/lib/queries";
import { FormField, FieldError } from "@/components/FormField";
import { PreferenceOptionGrid } from "@/components/PreferenceOptionGrid";
import {
  COMBAT_PREFERENCE_OPTIONS,
  FOCUS_PREFERENCE_OPTIONS,
  FITNESS_PREFERENCE_OPTIONS,
  type CombatPreferenceValue,
  type FocusPreferenceValue,
  type FitnessPreferenceValue,
} from "@/lib/profile-preference-data";
import {
  coerceCombat,
  coerceFitness,
  coerceFocus,
  draftDateToYmd,
} from "@/lib/profile-resume";
import { getErrorMessage } from "@/lib/api-errors";
import { YOM_HAMEAH_12_KEYS, YOM_HAMEAH_12_LABELS_HE, migrateLegacyYomHameahTo12, defaultYomHameah12Scores } from "@/lib/yom-hameah-12";
import { ARIA } from "@/lib/a11y";
import { SITE_NAME_HE } from "@/lib/brand";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: `עריכת פרופיל | ${SITE_NAME_HE}` },
      { name: "description", content: "עריכת הפרופיל האישי: שם, דפ״ר, רפואי, מא״ה, העדפות ותאריך גיוס." },
    ],
  }),
});

const DAPAR_SCORES = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const;
const MEDICAL_SCORES = [21, 45, 64, 72, 82, 97] as const;

const ease = [0.16, 1, 0.3, 1] as const;

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preferredName, setPreferredName] = useState("");
  const [dapar, setDapar] = useState<number | "">("");
  const [medical, setMedical] = useState<number | "">("");
  const [combat, setCombat] = useState<CombatPreferenceValue | "">("");
  const [focus, setFocus] = useState<FocusPreferenceValue | "">("");
  const [fitness, setFitness] = useState<FitnessPreferenceValue | "">("");
  const [draftDate, setDraftDate] = useState("");
  const [yomScores, setYomScores] = useState(() => defaultYomHameah12Scores());

  useEffect(() => { setMounted(true); }, []);

  const token = mounted ? getToken() : null;

  useEffect(() => {
    if (mounted && !token) navigate({ to: "/post-signup" });
  }, [mounted, token, navigate]);

  const { data: dash, isPending } = useQuery({
    ...dashboardQueryOptions(token),
    enabled: mounted && !!token,
  });

  useEffect(() => {
    if (!dash || hydrated) return;
    setHydrated(true);
    setPreferredName(dash.user.preferredName?.trim() ?? "");
    if (dash.stats?.daparScore != null) setDapar(dash.stats.daparScore);
    if (dash.stats?.medicalProfile != null) setMedical(dash.stats.medicalProfile);
    setCombat(coerceCombat(dash.preferences?.combatPreference));
    setFocus(coerceFocus(dash.preferences?.focus));
    setFitness(coerceFitness(dash.preferences?.physicalActivityLevel));
    setDraftDate(draftDateToYmd(dash.stats?.draftDate));
    const yom = migrateLegacyYomHameahTo12(dash.stats?.yomHameah);
    if (yom) setYomScores(yom);
  }, [dash, hydrated]);

  async function handleSave() {
    if (!getToken()) {
      toast.error("יש להתחבר");
      return;
    }
    setSaving(true);
    try {
      const yomHameah: YomHameah = { ...yomScores };
      await updateProfile({
        user: { preferredName: preferredName.trim() || undefined },
        stats: {
          daparScore: dapar === "" ? null : dapar,
          medicalProfile: medical === "" ? null : medical,
          draftDate: draftDate ? new Date(draftDate).toISOString() : null,
          yomHameah,
        },
        preferences: {
          combatPreference: combat || undefined,
          focus: focus || undefined,
          physicalActivityLevel: fitness || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("הפרופיל עודכן בהצלחה");
    } catch (e) {
      toast.error(getErrorMessage(e, "שגיאה בשמירת הפרופיל"));
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || (token && isPending && !dash)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-dust">טוען פרופיל…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-8"
      >
        <div className="border-b border-iron/30 pb-6">
          <Link
            to="/dashboard"
            className="mb-3 inline-flex items-center gap-1 text-sm text-dust transition hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            חזרה לדשבורד
          </Link>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">עריכת פרופיל</h1>
          <p className="mt-2 text-sm text-dust">כל השדות ניתנים לעדכון. שינויים נשמרים בלחיצה על «שמירה».</p>
        </div>

        {/* Personal info */}
        <section className="space-y-4 border border-iron/30 bg-card p-5 sm:p-8">
          <h2 className="text-base font-bold text-foreground">פרטים אישיים</h2>
          <FormField label="שם תצוגה">
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="איך לקרוא לכם?"
              className="input-field"
            />
          </FormField>
          <FormField label="אימייל">
            <p className="text-sm text-dust" dir="ltr">{dash?.user.email ?? "—"}</p>
          </FormField>
        </section>

        {/* Military scores */}
        <section className="space-y-4 border border-iron/30 bg-card p-5 sm:p-8">
          <h2 className="text-base font-bold text-foreground">ציונים צבאיים</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label='דפ"ר'>
              <select
                value={dapar}
                onChange={(e) => setDapar(e.target.value === "" ? "" : Number(e.target.value))}
                className="input-field"
              >
                <option value="">בחרו</option>
                {DAPAR_SCORES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </FormField>
            <FormField label="פרופיל רפואי">
              <select
                value={medical}
                onChange={(e) => setMedical(e.target.value === "" ? "" : Number(e.target.value))}
                className="input-field"
              >
                <option value="">בחרו</option>
                {MEDICAL_SCORES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="תאריך גיוס משוער">
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="input-field w-full max-w-xs text-left"
              min="2000-01-01"
              max="2038-12-31"
            />
          </FormField>
        </section>

        {/* Yom HaMeah */}
        <section className="space-y-4 border border-iron/30 bg-card p-5 sm:p-8">
          <h2 className="text-base font-bold text-foreground">ממדי מא״ה (12 ממדים)</h2>
          <p className="text-xs text-dust">דירוג 1 עד 5 לכל ממד. אלו משפיעים על דיוק התאמת התפקידים.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {YOM_HAMEAH_12_KEYS.map((key) => (
              <div key={key} className="border border-iron/20 bg-secondary/30 p-4">
                <label className="block">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{YOM_HAMEAH_12_LABELS_HE[key]}</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-primary" aria-hidden>
                      {yomScores[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={yomScores[key]}
                    onChange={(e) => setYomScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="mt-3 w-full accent-primary"
                    aria-valuetext={ARIA.rangeValue(YOM_HAMEAH_12_LABELS_HE[key], yomScores[key], 5)}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-6 border border-iron/30 bg-card p-5 sm:p-8">
          <h2 className="text-base font-bold text-foreground">העדפות שירות</h2>

          <div className="space-y-3">
            <p className="text-xs font-medium text-dust">כיוון שירות</p>
            <PreferenceOptionGrid
              options={COMBAT_PREFERENCE_OPTIONS}
              selected={combat}
              onSelect={setCombat}
              columnsClass="grid-cols-1 sm:grid-cols-2"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-dust">מיקוד</p>
            <PreferenceOptionGrid
              options={FOCUS_PREFERENCE_OPTIONS}
              selected={focus}
              onSelect={setFocus}
              columnsClass="grid-cols-1 sm:grid-cols-2"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-dust">רמת כושר</p>
            <PreferenceOptionGrid
              options={FITNESS_PREFERENCE_OPTIONS}
              selected={fitness}
              onSelect={setFitness}
              columnsClass="grid-cols-1 sm:grid-cols-3"
            />
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-between border-t border-iron/30 pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-3 disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "שומר…" : "שמירה"}
          </button>
          <Link to="/dashboard" className="text-sm text-dust transition hover:text-foreground">
            ביטול
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
