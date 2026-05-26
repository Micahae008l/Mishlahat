# על מדים (Al Madim)

אפליקציית TanStack Start + Vite עם API ב־Express ומסד MongoDB.

## הרצה מקומית

מהשורש של הפרויקט:

```bash
npm install
npm run dev
```

פקודה זו מפעילה **יחד** את Vite (ממשק) ואת השרת על פורט **3001**. כתובת ברירת המחדל של הממשק: **http://localhost:8080/** (לא 5173).

אם מריצים רק את הפרונט:

```bash
npm run dev:web
```

יש להריץ בנפרד `npm run server` — אחרת בקשות ל־`/api` ייכשלו (במצב dev תקבלו הודעת 503 מהפרוקסי).

## משתני סביבה

- **שורש הפרויקט** — `.env.example`: `VITE_API_URL` (אופציונלי בפיתוח; ריק = פרוקסי ל־`/api`).
- **`server/.env`** — לפי `server/.env.example`: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY` ליועץ AI. אופציונלי: `SMTP_*` לשליחת קוד OTP באימייל; בלי SMTP הקוד מודפס ללוג השרת (ובפיתוח גם ב־JSON כ־`devCode`).

## כניסה והרשמה

המערכת משתמשת ב־**קוד חד־פעמי לאימייל** (אין סיסמה). נקודות קצה:

- `POST /api/auth/request-otp` — גוף: `{ "email": "..." }`
- `POST /api/auth/verify-otp` — גוף: `{ "email": "...", "code": "123456" }`

## בנייה

```bash
npm run build
npm run preview
```

## פריסה (production)

חנות WordPress נשארת ב־`mike.haddad.co.il`; האפליקציה ב־`app.mike.haddad.co.il`, API ב־`api.mike.haddad.co.il`. מדריך מלא: **[DEPLOY.md](./DEPLOY.md)**.

## רישיון

Apache-2.0 (כפי שב־`LICENSE`).
