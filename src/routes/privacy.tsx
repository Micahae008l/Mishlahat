import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { CONTACT_EMAIL, OPERATOR_NAME, SITE_NAME_HE } from "@/lib/brand";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: `מדיניות פרטיות | ${SITE_NAME_HE}` },
      {
        name: "description",
        content: `איזה מידע ${SITE_NAME_HE} אוסף, למה, עם מי הוא משותף, ואיך מוחקים אותו.`,
      },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="מדיניות פרטיות"
      title="מה אנחנו יודעים עליכם, ומה אנחנו עושים עם זה"
      intro={`${SITE_NAME_HE} מבקש מכם נתונים אישיים ורגישים, אז מגיע לכם לדעת בדיוק מה קורה איתם. הדף הזה כתוב בעברית פשוטה, בלי אותיות קטנות.`}
    >
      <LegalSection title="1. מי אחראי למידע">
        <p>
          מפעיל האתר ובעל מאגר המידע הוא{" "}
          <strong className="text-foreground">{OPERATOR_NAME}</strong>. לכל פנייה בנושא פרטיות:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. איזה מידע אנחנו אוספים">
        <p>רק מה שאתם מזינים בעצמכם, ומעט נתונים טכניים:</p>
        <LegalList
          items={[
            <>
              <strong className="text-foreground">כתובת אימייל</strong> — חובה, זו דרך ההתחברות
              היחידה שלנו.
            </>,
            <>
              <strong className="text-foreground">שם פרטי וטלפון</strong> — אופציונלי, רק אם מילאתם.
            </>,
            <>
              <strong className="text-foreground">נתוני גיוס</strong> — ציון דפ״ר, פרופיל רפואי,
              ציוני מא״ה, מגדר, תאריכי גיוס ושחרור.
            </>,
            <>
              <strong className="text-foreground">העדפות שירות</strong> — קרבי/עורפי, מיקוד, רמת
              פעילות גופנית, מיקום.
            </>,
            <>
              <strong className="text-foreground">היסטוריית שימוש</strong> — ההתאמות והדוחות שהפקתם,
              וכמה פעמים השתמשתם ב־AI.
            </>,
            <>
              <strong className="text-foreground">נתונים טכניים</strong> — כתובת IP וזמני התחברות,
              לצורכי אבטחה וחסימת ניסיונות פריצה בלבד.
            </>,
          ]}
        />
        <p>
          אנחנו <strong className="text-foreground">לא</strong> מבקשים תעודת זהות, לא מספר חשבון
          בנק, ולא סיסמה. ההתחברות היא בקוד חד־פעמי לאימייל.
        </p>
      </LegalSection>

      <LegalSection title="3. הפרופיל הרפואי הוא מידע רגיש">
        <p>
          פרופיל רפואי הוא אינדיקציה למצב הבריאותי שלכם, ולכן אנחנו מתייחסים אליו כאל{" "}
          <strong className="text-foreground">מידע רגיש</strong> לפי חוק הגנת הפרטיות, התשמ״א־1981:
        </p>
        <LegalList
          items={[
            "המסירה שלו היא התנדבותית לחלוטין. אפשר להשתמש באתר בלעדיו, ההתאמה פשוט תהיה פחות מדויקת.",
            "הוא משמש אך ורק לחישוב התאמת תפקידים ולהסבר שמוצג לכם.",
            "הוא לא משותף עם אף גורם מסחרי, לא נמכר, ולא משמש לפרסום.",
            "הוא נמחק מיידית עם מחיקת החשבון, ואפשר גם למחוק רק אותו ולהשאיר את שאר החשבון.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. למה אנחנו משתמשים במידע">
        <LegalList
          items={[
            "כדי לחשב לכם התאמת תפקידים ולהפיק הסברים ודוחות.",
            "כדי להציג את הדשבורד, הספירה לגיוס וההיסטוריה שלכם.",
            "כדי לשלוח קוד התחברות חד־פעמי לאימייל.",
            "כדי להגן על המערכת מפני שימוש לרעה ולתקן תקלות.",
          ]}
        />
        <p>
          אנחנו לא שולחים דיוור שיווקי, ולא מנתחים את המידע שלכם למטרות שאינן קשורות לשירות שביקשתם.
        </p>
      </LegalSection>

      <LegalSection title="5. עם מי המידע משותף">
        <p>עם ספקי תשתית בלבד, וכל אחד מהם מקבל רק את המינימום שהוא צריך:</p>
        <LegalList
          items={[
            <>
              <strong className="text-foreground">OpenAI</strong> — מקבל את נתוני ההתאמה שלכם (דפ״ר,
              פרופיל רפואי, ציוני מא״ה, העדפות) כדי לייצר את ההמלצות.{" "}
              <strong className="text-foreground">האימייל, השם והטלפון שלכם לא נשלחים אליו.</strong>
            </>,
            <>
              <strong className="text-foreground">ספק שליחת האימייל</strong> — מקבל את כתובת האימייל
              שלכם כדי למסור את קוד ההתחברות.
            </>,
            <>
              <strong className="text-foreground">ספקי אחסון ושרתים</strong> (מסד הנתונים ושרתי
              האתר) — מאחסנים את המידע בשבילנו.
            </>,
            <>
              <strong className="text-foreground">Plausible Analytics</strong> — סטטיסטיקת שימוש
              אנונימית ומצטברת, בלי עוגיות ובלי זיהוי אישי.
            </>,
          ]}
        />
        <p>
          <strong className="text-foreground">
            המידע שלכם לא נמכר, לא מושכר, ולא מועבר לצה״ל, למיטב, או לכל גוף גיוס רשמי.
          </strong>{" "}
          {SITE_NAME_HE} הוא כלי עצמאי שאין לו שום קשר או שיתוף פעולה עם צה״ל. מסירת מידע לרשות
          כלשהי תיעשה רק אם נחויב לכך בצו שיפוטי.
        </p>
      </LegalSection>

      <LegalSection title="6. גיל השימוש">
        <p>
          השירות מיועד לבני <strong className="text-foreground">16 ומעלה</strong>. אם אתם מתחת לגיל
          18, השימוש מותנה בכך שהורה או אפוטרופוס יודע ומאשר שאתם משתמשים באתר ומוסרים בו את הנתונים
          האלה. אם התברר לנו שנרשם משתמש מתחת לגיל 16, נמחק את החשבון והמידע.
        </p>
      </LegalSection>

      <LegalSection title="7. כמה זמן שומרים, ואיך מוחקים">
        <p>
          המידע נשמר כל עוד החשבון פעיל. אין כרגע כפתור מחיקה עצמית באתר, אז המחיקה נעשית ידנית:
          שלחו מייל מהכתובת שאיתה נרשמתם אל{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          וכתבו מה למחוק — הכל, או רק שדות מסוימים. נבצע את המחיקה תוך 14 יום ונאשר לכם במייל.
          המחיקה היא סופית ולא ניתנת לשחזור.
        </p>
      </LegalSection>

      <LegalSection title="8. הזכויות שלכם">
        <p>
          לפי חוק הגנת הפרטיות אתם רשאים לעיין במידע שנשמר עליכם, לבקש לתקן מידע שגוי, ולבקש את
          מחיקתו. כל בקשה כזו נעשית באותה כתובת מייל, ואנחנו לא גובים עליה תשלום.
        </p>
      </LegalSection>

      <LegalSection title="9. אבטחה">
        <p>
          התקשורת עם האתר מוצפנת ב־HTTPS, אין לנו סיסמאות לאחסן (ההתחברות היא בקוד חד־פעמי), והגישה
          למסד הנתונים מוגבלת. יחד עם זאת, אף מערכת אינה חסינה לחלוטין, ואנחנו לא יכולים להבטיח
          אבטחה מוחלטת. אם תתרחש דליפה שנוגעת למידע שלכם, נודיע לכם באימייל.
        </p>
      </LegalSection>

      <LegalSection title="10. עוגיות ואחסון מקומי">
        <p>
          אנחנו לא משתמשים בעוגיות מעקב או פרסום. הדפדפן שלכם שומר מקומית אסימון התחברות כדי שלא
          תצטרכו להזדהות בכל כניסה — מחיקת נתוני הדפדפן מוחקת אותו.
        </p>
      </LegalSection>

      <LegalSection title="11. שינויים במדיניות">
        <p>
          אם נשנה את המדיניות, נעדכן את התאריך בראש הדף. שינוי מהותי — למשל הוספת שיתוף מידע עם גורם
          חדש — יימסר גם באימייל למשתמשים רשומים. ראו גם את{" "}
          <Link to="/terms" className="text-primary hover:underline">
            תנאי השימוש
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
