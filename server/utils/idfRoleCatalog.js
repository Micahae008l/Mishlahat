import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {string | null | undefined} undefined = not loaded */
let cached = undefined;
/** @type {object | null | undefined} */
let cachedParsed = undefined;

function loadRaw() {
  if (cached !== undefined) return cached;
  const custom = process.env.IDF_ROLES_CATALOG_PATH?.trim();
  const defaultPath = path.join(__dirname, "../data/idf-roles-preference-catalog.json");
  const paths = [...new Set([custom, defaultPath].filter(Boolean))];
  for (const p of paths) {
    try {
      cached = fs.readFileSync(p, "utf8").trim();
      return cached;
    } catch {
      /* try next */
    }
  }
  console.warn("[idfRoleCatalog] Catalog file not found; match-roles runs without embedded role list.");
  cached = null;
  return null;
}

/**
 * Raw JSON text of the IDF role preference catalog (large), or null if missing.
 * Cached after first read. Set IDF_ROLES_CATALOG_PATH to override file location.
 */
export function getIdfRoleCatalogJsonText() {
  return loadRaw();
}

/**
 * Parsed catalog object with `.roles` array, or null if missing/invalid.
 */
export function getIdfRoleCatalogParsed() {
  if (cachedParsed !== undefined) return cachedParsed;
  const raw = loadRaw();
  if (!raw) { cachedParsed = null; return null; }
  try {
    cachedParsed = JSON.parse(raw);
  } catch {
    cachedParsed = null;
  }
  return cachedParsed;
}
