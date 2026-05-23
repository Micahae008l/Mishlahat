/**
 * Waits until the local API accepts TCP on PORT (or times out), then starts Vite.
 * Replaces wait-on + shell chaining — Windows cmd does not treat `;` like bash,
 * which broke: `wait-on tcp:...; npm run dev:web` (entire tail became one resource string).
 */
import { createConnection } from "node:net";
import { spawn } from "node:child_process";
import process from "node:process";

const host = process.env.API_HOST || "127.0.0.1";
const port = parseInt(process.env.API_PORT || process.env.PORT || "3001", 10);
const timeoutMs = parseInt(process.env.API_WAIT_TIMEOUT_MS || "90000", 10);
const intervalMs = 400;

function tryConnectOnce() {
  return new Promise((resolve) => {
    let done = false;
    let tid;
    const finish = (val) => {
      if (done) return;
      done = true;
      if (tid) clearTimeout(tid);
      resolve(val);
    };
    const socket = createConnection({ port, host }, () => {
      socket.end();
      finish(true);
    });
    tid = setTimeout(() => {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      finish(false);
    }, 2000);
    socket.on("error", () => {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      finish(false);
    });
  });
}

async function waitForApi() {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await tryConnectOnce()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function main() {
  const up = await waitForApi();
  if (!up) {
    console.warn(
      `[dev] API לא נפתח על ${host}:${port} תוך ${timeoutMs}ms — מפעילים Vite בכל זאת (ייתכנו 503 עד שהשרת יעלה).`
    );
  }

  const child = spawn("npm run dev:web", {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
