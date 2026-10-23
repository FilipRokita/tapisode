/**
 * A hint that a visitor is signed in, kept in a plain cookie the page can read before it paints. The landing is static,
 * so the server cannot tell guests from members. A script in the head turns the cookie into a data-in attribute on the
 * page, and CSS shows the matching links from the first frame. The hint can be stale; the real answer comes from the
 * session request and corrects it.
 */
export const SESSION_HINT = "tapisode_in";

/** Runs in the head, before the first paint. */
export const SESSION_HINT_SCRIPT = `try{if(/(?:^|; )${SESSION_HINT}=1/.test(document.cookie))document.documentElement.dataset.in="1"}catch(e){}`;

export function setSessionHint(signedIn: boolean): void {
  document.cookie = `${SESSION_HINT}=${signedIn ? "1" : ""}; path=/; max-age=${signedIn ? 60 * 60 * 24 * 30 : 0}; samesite=lax`;
  if (signedIn) document.documentElement.dataset.in = "1";
  else delete document.documentElement.dataset.in;
}
