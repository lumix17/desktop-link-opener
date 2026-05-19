const SERVICES = ["discord", "linear", "spotify"];
const DEFAULTS = { discord: true, linear: true, spotify: true };

async function load() {
  const { enabled = {} } = await chrome.storage.sync.get("enabled");
  for (const svc of SERVICES) {
    const el = document.getElementById(`t-${svc}`);
    const value = enabled[svc] === undefined ? DEFAULTS[svc] : enabled[svc];
    el.checked = !!value;
    el.addEventListener("change", save);
  }
}

async function save() {
  const enabled = {};
  for (const svc of SERVICES) {
    enabled[svc] = document.getElementById(`t-${svc}`).checked;
  }
  await chrome.storage.sync.set({ enabled });
}

load();
