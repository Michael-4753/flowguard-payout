/**
 * Copy text to the clipboard with a resilient fallback.
 *
 * `navigator.clipboard` is only available in secure contexts (HTTPS) and can be
 * blocked by permissions policy — inside some in-app WebViews or on plain-http
 * previews it is simply `undefined`. When that happens we fall back to a hidden
 * <textarea> + `document.execCommand('copy')` so the copy buttons still work.
 *
 * Returns `true` only when the copy actually succeeded, so callers can surface a
 * clear failure state instead of silently pretending it worked.
 */
export async function copyText(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API (secure contexts only).
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  // Legacy fallback: temporary off-screen textarea + execCommand('copy').
  if (typeof document === "undefined") return false;
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-9999px";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
