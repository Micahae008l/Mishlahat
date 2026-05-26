# קח כיוון (Kach Kivun)

פלטפורמת הכנה לשירות בצה״ל: פרופיל אישי, מא״ה, והתאמת תפקידים עם AI.

## פיתוח מקומי

```bash
npm install
cd server && npm install && cd ..
npm run dev
```

- אתר: http://localhost:8080
- API: http://localhost:3001

העתיקו `server/.env.example` ל־`server/.env` והגדירו `JWT_SECRET`, `MONGODB_URI`, `OPENAI_API_KEY`, ו־SMTP לשליחת קודי OTP באימייל.

## פריסה

ראו [DEPLOY.md](./DEPLOY.md).
