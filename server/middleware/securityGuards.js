import { logSecurityEvent } from "../utils/securityLog.js";

/**
 * URL signatures that never appear in legitimate traffic to this API but are
 * constantly probed by vulnerability scanners and exploit kits.
 */
const SUSPICIOUS_URL_PATTERNS = [
  { re: /\.\.[\\/]/, label: "path traversal" },
  { re: /%2e%2e[\\/%]/i, label: "encoded path traversal" },
  { re: /\.(php|asp|aspx|jsp|cgi)\b/i, label: "foreign runtime probe" },
  { re: /\/(wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php)/i, label: "wordpress probe" },
  { re: /\/(phpmyadmin|pma|adminer|mysql)\b/i, label: "db admin probe" },
  { re: /\/\.(git|svn|hg|env|aws|ssh|htaccess|htpasswd)\b/i, label: "dotfile probe" },
  { re: /\/etc\/(passwd|shadow|hosts)/i, label: "system file probe" },
  { re: /<script\b/i, label: "xss probe" },
  { re: /(union[+\s]+select|select[+\s]+[^;&]{0,60}[+\s]+from[+\s]|information_schema)/i, label: "sql injection probe" },
  { re: /\$\{jndi:/i, label: "log4shell probe" },
  { re: /\/(actuator|\.vscode|\.idea|server-status|cgi-bin)\b/i, label: "infra probe" },
];

/**
 * Detects vulnerability-scanner URLs, logs them as security events, and
 * answers with a plain 404 so the scanner learns nothing.
 */
export function suspiciousPathGuard(req, res, next) {
  const url = String(req.originalUrl || req.url || "");
  // Match the decoded form as well — scanners hide signatures behind %-encoding.
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* malformed encoding — raw form still gets checked */
  }
  const hit = SUSPICIOUS_URL_PATTERNS.find((p) => p.re.test(url) || p.re.test(decoded));
  if (!hit) return next();

  logSecurityEvent("suspicious_path", req, {
    statusCode: 404,
    message: hit.label,
  });
  return res.status(404).json({ error: "Not found" });
}

/**
 * Mounted after all /api routes — anything landing here is an unknown API
 * path, which is usually endpoint enumeration when it happens in bulk.
 */
export function apiNotFoundHandler(req, res) {
  logSecurityEvent("not_found_probe", req, { statusCode: 404 });
  res.status(404).json({ error: "Not found" });
}
