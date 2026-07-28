# Deploy קח כיוון (Kach Kivun)

Live today:

| Service      | URL                          | Host               |
| ------------ | ---------------------------- | ------------------ |
| קח כיוון app | `https://kachkivun.com/`     | Cloudflare Workers |
| קח כיוון API | `https://api.kachkivun.com/` | Render             |

The WordPress shop at `mike.haddad.co.il` is a separate site and is not affected by
anything in this document.

---

## Who does what

### You (accounts, DNS, secrets)

1. **MongoDB Atlas** — free database in the cloud
2. **Render** — hosts the Express API (`server/`)
3. **Cloudflare** — hosts the React app (Workers) + DNS for subdomains
4. **DNS records** — point `api` and `app` at those services
5. **Secrets** — paste connection strings and API keys into Render (never commit them)

### Repo / agent (already done in code)

- `render.yaml` — one-click API deploy on Render
- CORS for `https://kachkivun.com` via `FRONTEND_URL` / `ALLOWED_ORIGINS`
- `npm run deploy:web` — build + Cloudflare deploy
- `.env.production.example` — production `VITE_API_URL`

---

## Step 1 — MongoDB Atlas (you, ~10 min)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free cluster.
2. **Database Access** → add a user with password.
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) so Render can connect.
4. **Connect** → **Drivers** → copy the URI. Replace `<password>` with your user password.  
   Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/kachkivun?retryWrites=true&w=majority`

Save this as `MONGODB_URI` — you will paste it into Render in step 2.

---

## Step 2 — API on Render (you, ~15 min)

1. Push this repo to **GitHub** (if it is not there yet).
2. Open [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the GitHub repo. Render reads `render.yaml` and creates **kachkivun-api**.
4. In the service **Environment**, set (if not already):

   | Key                  | Value                                                                       |
   | -------------------- | --------------------------------------------------------------------------- |
   | `MONGODB_URI`        | your Atlas URI                                                              |
   | `JWT_SECRET`         | long random string (Render can generate one; or use `openssl rand -hex 32`) |
   | `ACCESS_TOKEN_TTL`   | `15m`                                                                       |
   | `REFRESH_TOKEN_DAYS` | `30`                                                                        |
   | `OPENAI_API_KEY`     | your OpenAI key                                                             |
   | `FRONTEND_URL`       | `https://kachkivun.com`                                             |
   | `ALLOWED_ORIGINS`    | `https://kachkivun.com`                                             |
   | `SMTP_*`             | optional — for real OTP emails (see `server/.env.example`)                  |

5. Wait until deploy is **Live**. Open the Render URL (e.g. `https://kachkivun-api.onrender.com/api/health`) — you should see `{"status":"ok",...}`.

6. **Custom domain on Render:** Service → **Settings** → **Custom Domains** → add `api.kachkivun.com`. Render shows a **CNAME** target (e.g. `kachkivun-api.onrender.com`).

---

## Step 3 — DNS for API (you, at your domain host)

Where you manage `haddad.co.il` (WordPress host, registrar, or Cloudflare):

| Type  | Name  | Value                        |
| ----- | ----- | ---------------------------- |
| CNAME | `api` | the hostname Render gave you |

Wait a few minutes, then check: **https://api.kachkivun.com/api/health**

---

## Step 4 — Frontend on Cloudflare (you + one local command)

### 4a. Cloudflare account

1. [dash.cloudflare.com](https://dash.cloudflare.com) → add site **`haddad.co.il`** (or only use Cloudflare for DNS if the domain is elsewhere).
2. If the domain is not on Cloudflare yet, change nameservers at your registrar to Cloudflare’s (they will show you which two).
3. Install Wrangler and log in (on your PC, in this repo):

   ```powershell
   cd C:\Users\Michael\Mishlahat
   npx wrangler login
   ```

### 4b. Build with production API URL

PowerShell:

```powershell
cd C:\Users\Michael\Mishlahat
npm run deploy:web
```

`.env.production` already pins `VITE_API_URL=https://api.kachkivun.com`, so the build
picks it up on its own. Only set the variable by hand if you are deploying against a
different API.

First deploy creates a `*.workers.dev` URL. Test it in the browser (login may hit your real API).

### 4c. Custom domain for the app

1. Cloudflare dashboard → **Workers & Pages** → your worker **tanstack-start-app**.
2. **Settings** → **Domains & Routes** → **Add** → `kachkivun.com`.
3. If DNS is on Cloudflare, it often adds the record automatically. Otherwise add:

   | Type  | Name  | Value                             |
   | ----- | ----- | --------------------------------- |
   | CNAME | `app` | the worker route Cloudflare shows |

Open **https://kachkivun.com** — the shop at the root domain is untouched.

---

## Step 5 — Smoke test (you)

1. `https://api.kachkivun.com/api/health` → OK JSON
2. `https://kachkivun.com` → landing page loads
3. Login with email → OTP (check Render logs if SMTP not set yet)
4. Complete onboarding → dashboard loads

---

## Redeploy after code changes

**API:** push to GitHub → Render auto-deploys.

**Frontend:**

```powershell
npm run deploy:web
```

---

## Troubleshooting

| Problem                      | Fix                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| CORS error in browser        | On Render, set `ALLOWED_ORIGINS` exactly to `https://kachkivun.com` (no trailing slash). |
| API 503 / connection refused | Render service sleeping (free tier) — wait ~30s on first request; or upgrade plan.               |
| OTP never arrives            | Set `SMTP_*` on Render; until then, see OTP in **Render → Logs**.                                |
| App calls wrong API          | Rebuild with `VITE_API_URL=https://api.kachkivun.com` before `deploy:web`.                   |
| MongoDB connection failed    | Atlas IP allowlist includes `0.0.0.0/0`; password in URI is URL-encoded.                         |

