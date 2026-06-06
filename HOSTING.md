# Hosting on GitHub Pages

The site now lives at the **repo root** (`index.html` + `data/` + the markdown docs),
so it can be published straight from the default branch with **no subfolder**.

The firmware sources under `src/` are **git submodules** (see `.gitmodules`), pinned
to the exact commits this analysis was built against. They are not vendored into the
repo and are not part of the published site.

## Publish (classic Pages, deploy from a branch)
```bash
git add -A
git commit -m "Interactive Flipper fork atlas"
git push -u origin main
```
Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)`**.

Live at `https://<you>.github.io/<repo>/`:
- `…/` → loads the explorer (root `index.html`)
- deep links work, e.g. `…/#/f/rc-kq-dec`, `…/#/fw/M`, `…/#/doc/SECURITY.md`

> `.nojekyll` is present so Pages serves every file verbatim (no Jekyll processing).

### Submodules + Pages
Classic Pages serves the branch contents as-is; it does **not** fetch submodules, so
`src/` simply isn't part of the site (which is what we want — no firmware in the
published output). If you switch to the **GitHub Actions** Pages builder, set
`submodules: false` on the checkout step to keep it fast.

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
