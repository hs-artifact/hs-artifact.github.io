// Daily sync: reads learning progress from Cloudflare Workers KV and writes data/learning.json.
// Only module-level completion and timestamps are published; notes, highlights and bookmarks are never read out.
// Required environment (GitHub Actions secrets): CF_API_TOKEN (KV read-only), CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, PROGRESS_KEY.
import fs from "node:fs";

const { CF_API_TOKEN, CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, PROGRESS_KEY } = process.env;
for (const [k, v] of Object.entries({ CF_API_TOKEN, CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, PROGRESS_KEY }))
  if (!v) throw new Error(`Missing secret ${k}`);

const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(PROGRESS_KEY)}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
if (!res.ok) throw new Error(`KV read failed: HTTP ${res.status}`);
const raw = await res.json();

const modules = JSON.parse(fs.readFileSync("data/modules.json", "utf8"));
const ct = raw.ct || {};
const checks = raw.checks || {};
const isDone = (id) => (ct[id] ? !!ct[id].v : !!checks[id]);
const timeOf = (id) => (ct[id] && ct[id].v ? ct[id].t : null);
const day = (t) => (t ? new Date(t).toISOString().slice(0, 10) : null);

const out = { updated: new Date().toISOString().slice(0, 10), modules: {} };
let done = 0, total = 0, last = 0;
for (const st of modules.stages)
  for (const m of st.modules) {
    const d = m.items.filter(isDone);
    const times = d.map(timeOf).filter(Boolean);
    const lastT = times.length ? Math.max(...times) : null;
    if (lastT && lastT > last) last = lastT;
    done += d.length; total += m.items.length;
    out.modules[m.id] = {
      done: d.length,
      total: m.items.length,
      status: d.length === m.items.length ? "done" : d.length ? "active" : "planned",
      completed: d.length === m.items.length ? day(lastT) : null,
      last_activity: day(lastT),
    };
  }
out.summary = { done, total, last_activity: day(last || null) };

const prev = fs.existsSync("data/learning.json") ? fs.readFileSync("data/learning.json", "utf8") : "";
const strip = (s) => s.replace(/"updated": "[^"]*",?/, "");
const next = JSON.stringify(out, null, 1);
if (strip(prev) === strip(next)) console.log("No change");
else { fs.writeFileSync("data/learning.json", next); console.log(`Updated: ${done}/${total} items`); }
