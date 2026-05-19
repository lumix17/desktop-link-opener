# Desktop Link Opener

A lightweight Chrome extension that intercepts clicks on Discord, Linear, and Spotify links and reopens them in their matching desktop application — for both in-page clicks and links coming from external apps (Slack, Mail, iMessage, etc.) when Chrome is set as the default browser.

No tracking, no telemetry, no remote calls. Pure URL-scheme rewriting on the client side.

## Features

- **Discord** — channel links, invites, events, templates, and `discord.gg/*` open in the Discord desktop app
- **Linear** — workspace links (issues, projects, teams, views, ...) open in the Linear desktop app
- **Spotify** — tracks, albums, artists, playlists, podcasts open in the Spotify desktop app
- **Modifier-key bypass** — hold ⌘ / Ctrl / Shift / Alt while clicking to open in the browser as normal
- **Middle-click support** — auxclick is redirected too
- **Web client safe** — the script does not run on `discord.com`, `linear.app`, or `open.spotify.com` themselves, so the web apps keep working
- **Zero dependencies, zero network calls**

## Installation

The extension is unpacked-only — there is no Chrome Web Store listing.

1. Clone this repo (or download as ZIP and extract):
   ```bash
   git clone https://github.com/YOUR_USERNAME/desktop-link-opener.git
   ```
2. Open `chrome://extensions` (also works in Brave, Edge, Arc, or any Chromium browser)
3. Toggle **Developer mode** on (top right)
4. Click **Load unpacked**
5. Select the cloned folder

The extension activates immediately. Pin the toolbar icon for a popup with status and test links.

## Supported URL patterns

| Service | Web URL | Deep link sent |
|---------|---------|----------------|
| Discord | `https://discord.com/channels/123/456` | `discord://discord.com/channels/123/456` |
| Discord | `https://discord.com/invite/abc` | `discord://discord.com/invite/abc` |
| Discord | `https://discord.gg/abc` | `discord://discord.gg/abc` |
| Linear | `https://linear.app/team/issue/X-123` | `linear://linear.app/team/issue/X-123` |
| Spotify | `https://open.spotify.com/track/ID?si=X` | `spotify:track:ID` |
| Spotify | `https://open.spotify.com/playlist/ID` | `spotify:playlist:ID` |

For Linear, only workspace paths (`issue`, `team`, `project`, `view`, `inbox`, `roadmap`, `document`, `initiative`, `cycle`, `label`, `member`, `my-views`, `my-issues`, `settings`) are rewritten. Marketing pages like `linear.app/features` stay in the browser.

For Spotify, the `si=` share tracking parameter is stripped and slashes are converted to colons to produce a proper `spotify:` URI.

## How it works

Two interception layers handle different click sources:

**Content script (`content.js`)** runs on every page except the three web clients themselves. It listens for `click` and `auxclick` events at the capture phase, walks the composed path to find the nearest anchor (Shadow-DOM safe), and if the href matches a known service, calls `preventDefault()` and navigates the page to the deep link.

**Service worker (`background.js`)** uses `chrome.webNavigation.onBeforeNavigate` to catch full-page navigations to matching hosts — which is what happens when a link is clicked outside Chrome (e.g., in Slack) and macOS forwards it to the default browser. The worker tracks freshly-opened tabs via `chrome.tabs.onCreated` to redirect them before any content loads.

## Bypass

To open a link in the browser instead of the desktop app, hold any modifier key while clicking:

- **⌘** (Mac) or **Ctrl** (Windows / Linux) — open in browser, new tab
- **Shift** — open in new window
- **Alt** — platform-dependent

Without a modifier, both left-click and middle-click are redirected.

## Adding a new service

The service list is duplicated between `content.js` and `background.js`. To add a new handler, edit the `services` array in `content.js` and the matching branch in `findDeeplink()` inside `background.js`:

```js
{
  name: "yourapp",
  match(u) {
    return u.hostname === "yourapp.com" && u.pathname.startsWith("/something/");
  },
  deeplink(raw) {
    return "yourapp://" + raw.substring(raw.indexOf("://") + 3);
  },
}
```

Also add the host to:

- `exclude_matches` in `manifest.json` (so the content script stays out of the web client)
- `host_permissions` in `manifest.json`
- The `url` filter array in `background.js`

## Files

```
manifest.json   Manifest V3 config
content.js      Click interceptor with per-service rewrite rules
background.js   Service worker handling external navigations
popup.html      Toolbar popup with status and test links
icons/          16, 48, 128 px PNGs
```

## Permissions

The extension requests:

- `webNavigation` — to intercept full-page navigations before they reach the network
- `tabs` — to redirect tabs to deep-link URLs
- Host access to `discord.com`, `discord.gg`, `linear.app`, `open.spotify.com`

No content of any web page is read or stored.

## License

MIT — see [LICENSE](LICENSE).
