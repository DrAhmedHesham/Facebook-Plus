// "Open in Facebook" — content script.
//
// Runs on facebook.com (and fb.* short domains) pages loaded in Safari and sends
// the viewer into the sideloaded Facebook app through its fb:// URL scheme.
//
// Always use the FacebookPlus link bridge, which carries the clean HTTPS URL
// into the app. Facebook's advertised fb:// metadata changes between releases
// and can bypass the bridge or fall back to Home on a re-signed build:
//        fb://fbplusbridge?url=<current url>
//
// A short-lived sessionStorage guard prevents a redirect loop if iOS bounces the
// viewer back to the same Safari page.

(() => {
  "use strict";

  const currentURL = () => new URL(window.location.href);
  const attemptKey = () => `open-in-facebook:${window.location.href}`;

  // google.js stashes the clean Facebook URL it was sent from in the fragment,
  // because fragments survive HTTP redirects and are never sent to the server.
  function markerURL() {
    const marker = currentURL().hash.match(/(?:^#|&)open-in-facebook=([^&]+)/)?.[1];
    if (!marker) return null;
    try {
      return decodeURIComponent(marker);
    } catch {
      return null;
    }
  }

  function genericFallback() {
    const href = markerURL() || window.location.href;
    return `fb://fbplusbridge?url=${encodeURIComponent(href)}`;
  }

  function nativeDestination() {
    return genericFallback();
  }

  function openInApp() {
    const destination = nativeDestination();
    if (!destination) return false;

    const now = Date.now();
    const previous = Number(sessionStorage.getItem(attemptKey()) || 0);
    if (now - previous < 5000) return true; // already tried very recently

    try {
      sessionStorage.setItem(attemptKey(), String(now));
    } catch {}

    window.location.replace(destination);
    return true;
  }

  openInApp();
})();
