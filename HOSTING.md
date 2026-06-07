# Hosting on GitHub Pages

The site now lives at the **repo root** (`index.html` + `data/` + the markdown docs),
so it can be published straight from the default branch with **no subfolder**.

The firmware sources under `src/` are **git submodules** (see `.gitmodules`), pinned
to the exact commits this analysis was built against. They are not vendored into the
repo and are not part of the published site.

## Publish — GitHub Actions (required here, because of submodules)
A workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys the
static root and **skips submodules**, so the multi-GB firmware trees are never fetched.

```bash
git add -A
git commit -m "Interactive Flipper fork atlas"
git push -u origin master
```
Then on GitHub: **Settings → Pages → Build and deployment → Source → "GitHub Actions"**.
The workflow runs on every push to `master` (and via "Run workflow"); watch the
**Actions** tab for the green *Deploy site to GitHub Pages* run.

Live at `https://<you>.github.io/<repo>/`:
- `…/` → loads the explorer (root `index.html`)
- deep links work, e.g. `…/#/f/rc-kq-dec`, `…/#/fw/M`, `…/#/doc/SECURITY.md`

> ⚠️ **Do NOT use the classic "Deploy from a branch" source for this repo.** That
> builder checks the repo out **with submodules**, tries to pull RogueMaster +
> Momentum (multi-GB), and blows past the Pages **1 GB site / ~10-min build** limits
> → the build fails → **404**. The Actions workflow avoids this with
> `submodules: false`, and prunes `.git` / `.github` / `.claude` / empty `src/` from
> the artifact so only the site ships.

### The workflow, in brief
```yaml
- uses: actions/checkout@v4
  with: { submodules: false }     # ← the key line: don't fetch the firmware trees
- run: rm -rf .git .github .claude src
- uses: actions/upload-pages-artifact@v3
  with: { path: '.' }
- uses: actions/deploy-pages@v4
```

## Cloning this repo elsewhere
```bash
git clone <repo-url>
cd <repo>
git submodule update --init       # optional: fetch the firmware sources at pinned commits
```
The explorer and docs work without the submodules; you only need them to re-run code
verification or rebuild against the firmware trees.

## Updating the site
Edit `data/features.json` / `data/structure.json` → `node build.mjs` → commit the
regenerated `data/features.js` + `FEATURE-TREE.md` (+ any doc edits) → push. Pages
redeploys automatically.

## Local preview
```bash
python3 -m http.server 8771 --directory .
# → http://localhost:8771/   (the Documents tab needs http like this; file:// blocks its fetches)
```

## Notes
- Fonts load from Google Fonts (CDN) — fine online; local fallbacks keep it readable offline.
- The atlas contains analysis/metadata only (no firmware source). It does cite a
  third-party dev's leaked API key found in Momentum's tree (already public there) —
  kept intentionally. Prefer a private repo + Pages if any of this is sensitive.
- Any static host works identically (Netlify, Cloudflare Pages, etc.) — point it at the root.
