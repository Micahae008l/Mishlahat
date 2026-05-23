import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { IdfPhotoPanel } from "@/components/IdfPhotoPanel";
import { getIdfPhoto } from "@/lib/idf-images";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("נא להזין אימייל תקין");
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(email.trim());
      if (res.delivery === "console") {
        if (res.devCode) {
          toast.success(`ללא SMTP — לא נשלח מייל. קוד לפיתוח: ${res.devCode}`, { duration: 12_000 });
        } else {
          toast.error("השרת לא שלח אימייל ולא החזיר קוד בדיקה. בדקו הגדרת SMTP ב־server/.env.");
        }
      } else {
        toast.success("שלחנו קוד באימייל (בדקו גם בספאם)");
      }
      setCodeSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחת קוד");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      toast.error("נא להזין קוד בן 6 ספרות");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim(), clean);
      setToken(res.token);
      toast.success(
        res.isNewUser
          ? "האימייל אומת — אין עדיין פרופיל מלא, ממשיכים להשלמת הרשמה."
          : "התחברתם בהצלחה"
      );
      navigate({ to: res.isNewUser ? "/post-signup" : "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "קוד לא תקין");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      {/* Form side */}
      <div
        dir="rtl"
        className="flex w-full shrink-0 flex-col justify-between px-8 py-10 sm:px-12 md:max-w-[440px] lg:max-w-[480px]"
      >
        <nav className="flex gap-8 border-b border-iron/30 text-sm font-semibold">
          <span className="border-b-2 border-primary pb-3 text-foreground">כניסה</span>
          <Link to="/post-signup" className="pb-3 text-dust transition hover:text-foreground">
            הרשמה
          </Link>
        </nav>

        <div className="mx-auto w-full max-w-sm flex-1 space-y-6 py-10">
          <div className="text-right">
            <h1 className="text-2xl font-bold text-foreground">כניסה עם קוד</h1>
            <p className="mt-2 text-sm text-dust leading-relaxed">
              מזינים אימייל, מקבלים קוד, ונכנסים. אם אין חשבון, ניצור אחד אוטומטית.
            </p>
          </div>

          <form className="space-y-4" onSubmit={codeSent ? verifyCode : sendCode}>
            <div className="space-y-1.5">
              <label className="block text-right text-sm font-medium text-dust">אימייל</label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={codeSent}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="input-field pl-10 pr-4 disabled:opacity-50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dust/40">
                  <Mail className="h-4 w-4" />
                </span>
              </div>
            </div>

            {codeSent && (
              <div className="space-y-1.5">
                <label className="block text-right text-sm font-medium text-dust">קוד אימות</label>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="input-field text-center font-mono text-2xl font-bold tracking-[0.35em]"
                />
              </div>
            )}

            {codeSent && (
              <button
                type="button"
                disabled={loading}
                onClick={() => sendCode()}
                className="block w-full text-right text-xs text-primary hover:underline disabled:opacity-50"
              >
                שלחו קוד חדש
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 active:scale-[0.97]"
            >
              <ChevronLeft className="h-4 w-4" />
              {loading ? "ממתין…" : codeSent ? "אמתו והיכנסו" : "שלחו קוד"}
            </button>
          </form>

          <p className="border border-iron/30 bg-card px-4 py-3 text-right text-xs leading-relaxed text-dust rounded-sm">
            אין בדיקה מול גוגל שהמייל &quot;קיים&quot;. אימייל חדש יקבל קוד כמו חשבון קיים; אחרי האימות ניצור חשבון ונמשיך להשלמת פרופיל אם צריך.
          </p>

          <p className="text-center text-[11px] text-dust/40">
            בלחיצה אתם מסכימים ל
            <span className="cursor-pointer text-dust underline-offset-2 hover:underline">תנאי שימוש</span>
            {" "}ול
            <span className="cursor-pointer text-dust underline-offset-2 hover:underline">מדיניות פרטיות</span>
            .
          </p>
        </div>
      </div>

      {/* Photo side */}
      <div className="relative hidden flex-1 md:flex md:flex-col">
        <IdfPhotoPanel
          photo={getIdfPhoto("border-prep")}
          aspectClassName="absolute inset-0 min-h-0"
          className="absolute inset-0"
          overlayClassName="from-background/40 via-background/20 to-transparent"
          imgClassName="object-[center_35%]"
        />

        <div dir="rtl" className="relative mt-auto space-y-4 p-10 md:p-14">
          <p className="font-mono text-xs tracking-widest text-dust/60 uppercase">
            פלטפורמת הכנה לשירות
          </p>
          <h2 className="text-4xl font-black leading-[1.05] text-foreground lg:text-5xl">
            נכנסים מהר.
            <br />
            <span className="text-primary">בלי סיסמה.</span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-dust">
            משלחת שומרת את הפרופיל שלכם ומאפשרת להשתמש ביועץ AI אחרי הזנת דפ״ר, פרופיל רפואי וציוני מא״ה.
          </p>
        </div>

        <div dir="rtl" className="relative border-t border-iron/20 px-10 py-4 md:px-14" />
      </div>
    </div>
  );
}
