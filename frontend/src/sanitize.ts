import DOMPurify from "dompurify";

// The Phase-2 gate: every bit of post HTML runs through DOMPurify before it is
// injected. Authored content is trusted today, but author/UGC pipelines are
// coming, so sanitizing here now means no render path is ever unguarded.
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
