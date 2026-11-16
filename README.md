# hs-artifact.github.io

Personal site of Hendro Sutrisno: industrial data and digitalization for oil & gas and mining.

- `index.html`: the page (static, no build step)
- `data/modules.json`: programme structure (stages, modules, steps)
- `data/learning.json`: progress per module, written by the daily sync
- `scripts/sync.mjs` + `.github/workflows/sync-learning.yml`: reads module completion and timestamps once a day and commits `learning.json` only when it changed. Notes and personal annotations are never read.

Secrets for the sync (Settings → Secrets and variables → Actions): `CF_API_TOKEN` (Workers KV read-only), `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID`, `PROGRESS_KEY`.
