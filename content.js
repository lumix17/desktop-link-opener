(function () {
  const SPOTIFY_TYPES = new Set([
    "track",
    "album",
    "artist",
    "playlist",
    "show",
    "episode",
    "user",
  ]);

  const LINEAR_WORKSPACE_SEGMENTS = new Set([
    "issue",
    "team",
    "project",
    "view",
    "inbox",
    "roadmap",
    "document",
    "initiative",
    "cycle",
    "label",
    "member",
    "my-views",
    "my-issues",
    "settings",
  ]);

  const services = [
    {
      name: "discord",
      match(u) {
        const host = u.hostname.replace(/^www\./, "");
        if (host === "discord.com" || host === "discordapp.com") {
          return /^\/(channels|invite|events|template)\//.test(u.pathname);
        }
        if (host === "discord.gg") {
          return u.pathname.length > 1;
        }
        return false;
      },
      deeplink(raw) {
        return "discord://" + raw.substring(raw.indexOf("://") + 3);
      },
    },
    {
      name: "linear",
      match(u) {
        if (u.hostname !== "linear.app") return false;
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length < 2) return false;
        return LINEAR_WORKSPACE_SEGMENTS.has(parts[1]);
      },
      deeplink(raw) {
        return "linear://" + raw.substring(raw.indexOf("://") + 3);
      },
    },
    {
      name: "spotify",
      match(u) {
        if (u.hostname !== "open.spotify.com") return false;
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length < 2) return false;
        return SPOTIFY_TYPES.has(parts[0]);
      },
      deeplink(raw) {
        const u = new URL(raw);
        const parts = u.pathname.split("/").filter(Boolean);
        return "spotify:" + parts.join(":");
      },
    },
  ];

  const enabledServices = { discord: true, linear: true, spotify: true };

  try {
    chrome.storage.sync.get("enabled", (data) => {
      if (data && data.enabled) {
        for (const k of Object.keys(enabledServices)) {
          if (data.enabled[k] !== undefined) enabledServices[k] = !!data.enabled[k];
        }
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" || !changes.enabled) return;
      const next = changes.enabled.newValue || {};
      for (const k of Object.keys(enabledServices)) {
        if (next[k] !== undefined) enabledServices[k] = !!next[k];
      }
    });
  } catch (e) {
    // chrome.storage not available — fall back to defaults (all on)
  }

  function findDeeplink(rawUrl) {
    let u;
    try {
      u = new URL(rawUrl);
    } catch (e) {
      return null;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    for (const svc of services) {
      if (!enabledServices[svc.name]) continue;
      if (svc.match(u)) return svc.deeplink(rawUrl);
    }
    return null;
  }

  function findAnchor(e) {
    const path = e.composedPath ? e.composedPath() : [];
    for (const n of path) {
      if (n && n.tagName === "A" && n.href) return n;
    }
    let cur = e.target;
    while (cur && cur !== document) {
      if (cur.tagName === "A" && cur.href) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function handle(e) {
    if (e.defaultPrevented) return;
    if (e.type === "click") {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    } else if (e.type === "auxclick") {
      if (e.button !== 1) return;
    }
    const anchor = findAnchor(e);
    if (!anchor) return;
    const deeplink = findDeeplink(anchor.href);
    if (!deeplink) return;
    e.preventDefault();
    e.stopPropagation();
    window.location.href = deeplink;
  }

  document.addEventListener("click", handle, true);
  document.addEventListener("auxclick", handle, true);
})();
