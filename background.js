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

const enabledServices = { discord: true, linear: true, spotify: true };

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

function findDeeplink(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch (e) {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "");

  if (enabledServices.discord) {
    if (host === "discord.com" || host === "discordapp.com") {
      if (/^\/(channels|invite|events|template)\//.test(u.pathname)) {
        return "discord://" + rawUrl.substring(rawUrl.indexOf("://") + 3);
      }
    }
    if (host === "discord.gg" && u.pathname.length > 1) {
      return "discord://" + rawUrl.substring(rawUrl.indexOf("://") + 3);
    }
  }

  if (enabledServices.linear && host === "linear.app") {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && LINEAR_WORKSPACE_SEGMENTS.has(parts[1])) {
      return "linear://" + rawUrl.substring(rawUrl.indexOf("://") + 3);
    }
  }

  if (enabledServices.spotify && host === "open.spotify.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && SPOTIFY_TYPES.has(parts[0])) {
      return "spotify:" + parts.join(":");
    }
  }

  return null;
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return;
    const deeplink = findDeeplink(details.url);
    if (!deeplink) return;
    chrome.tabs.update(details.tabId, { url: deeplink }, () => {
      void chrome.runtime.lastError;
    });
  },
  {
    url: [
      { hostEquals: "discord.com" },
      { hostEquals: "www.discord.com" },
      { hostEquals: "discordapp.com" },
      { hostEquals: "discord.gg" },
      { hostEquals: "linear.app" },
      { hostEquals: "open.spotify.com" },
    ],
  }
);
