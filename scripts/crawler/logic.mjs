const PATH_EXTENSION = /\.[a-z0-9]+$/i;

export const SKIP_EXT =
  /\.(css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|pdf|zip|gz|xml|rss|atom|mp3|mp4|mov|webm|woff2?|ttf|eot|docx?|xlsx?|pptx?)$/i;

export const SKIP_PATH = Object.freeze([
  "/wp-admin",
  "/wp-json",
  "/wp-login",
  "/wp-content/",
  "/wp-includes/",
  "/feed",
  "/trackback",
  "/comment-page-",
  "xmlrpc.php",
]);

export function normalizeUrl(href, base) {
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.search) return null;
  url.hash = "";
  // WordPress canonicalizes to trailing slash; normalizing avoids fetching
  // /page and /page/ as two entries.
  if (!url.pathname.endsWith("/") && !PATH_EXTENSION.test(url.pathname)) {
    url.pathname += "/";
  }
  return url.href;
}

export function sameSite(url, startUrl) {
  const strip = (hostname) => hostname.replace(/^www\./, "");
  return strip(new URL(url).hostname) === strip(new URL(startUrl).hostname);
}

export function shouldSkip(url) {
  const { pathname } = new URL(url);
  const lower = pathname.toLowerCase();
  if (SKIP_EXT.test(lower)) return true;
  return SKIP_PATH.some((path) => lower.includes(path));
}

export function parseRobotsDisallows(text) {
  const disallows = [];
  let applies = false;
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").split("#")[0].trim();
    if (key === "user-agent") applies = value === "*";
    else if (applies && key === "disallow" && value) disallows.push(value);
  }
  return disallows;
}

export function isRobotsDisallowed(url, disallows) {
  const pathname = new URL(url).pathname;
  return disallows.some((disallow) => pathname.startsWith(disallow));
}

export function extractLinks(html, pageUrl) {
  const links = [];
  for (const match of html.matchAll(/href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const href = (match[2] ?? match[3] ?? "").trim();
    if (href) {
      const normalized = normalizeUrl(href, pageUrl);
      if (normalized) links.push(normalized);
    }
  }
  return links;
}
