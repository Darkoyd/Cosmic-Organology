// Page-transition fallback for browsers that support View Transitions only within a page
// (Firefox 144+). Chrome/Edge/Safari animate between pages natively via `@view-transition`
// in style.css, so this script does nothing there.
// Here, internal links are fetched and swapped in place inside document.startViewTransition,
// which gives the same node → title morph. Any failure falls back to a normal page load.
(() => {
  if (!document.startViewTransition || "CSSViewTransitionRule" in window) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  async function go(url, push) {
    let doc;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      doc = new DOMParser().parseFromString(await res.text(), "text/html");
    } catch {
      location.href = url;
      return;
    }
    document.startViewTransition(() => {
      document.title = doc.title;
      document.body.replaceWith(doc.body);
      if (push) history.pushState(null, "", url);
      // Scripts inserted this way don't run; re-create them so the home graph starts again.
      for (const old of document.body.querySelectorAll("script")) {
        const s = document.createElement("script");
        for (const a of old.attributes) s.setAttribute(a.name, a.value);
        s.textContent = old.textContent;
        old.replaceWith(s);
      }
      const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      target ? target.scrollIntoView() : scrollTo(0, 0);
    });
  }

  addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return; // external or same-page anchor
    e.preventDefault();
    go(url, true);
  });

  addEventListener("popstate", () => go(new URL(location.href), false));
})();
