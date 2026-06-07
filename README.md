# Flipper Fork Forensics

An interactive, evidence-backed comparison of four Flipper Zero firmwares —
**Official**, **Unleashed**, **RogueMaster**, **Momentum** — focused on the
**NFC** and **SubGhz** layers: capabilities, code provenance, changelog accuracy,
security posture, and the structural graph of how features decompose into shared
primitives (modulations, encodings, ciphers, RF layers) and external apps (FAPs).

## View it
- **Live:** open `index.html` (served over http — see [HOSTING.md](HOSTING.md) for GitHub Pages).
- **Local:** `python3 -m http.server 8771 --directory .` → <http://localhost:8771/>
- Deep links are shareable: `#/f/<feature>`, `#/fw/<O|U|R|M>`, `#/doc/<file>`.

## What's here
| Path | What |
|---|---|
| `index.html` | the interactive explorer (single-page app) |
| `data/features.json` | **source of truth** — per-fork capability matrix |
| `data/structure.json` | **source of truth** — graph layer: node types, relations, FAPs |
| `build.mjs` | merges the two → `data/features.js` (app) + `FEATURE-TREE.md` |
| `REPORT.md` | executive synthesis |
| `PROVENANCE.md` | lineage graph + who-copied-what ledger |
| `SECURITY.md` | security/abuse audit (verdicts + cleared items) |
| `CRYPTO-CHAIN.md` | Keeloq crypto chain: hardware key → enclave → keystore → learning algos (Mermaid + GitHub permalinks) |
| `HARDWARE.md` | hardware ↔ firmware map (tech-specs chips → analysis) |
| `FEATURE-TREE.md` | generated completeness matrix + relationship appendix |
| `sections/` | per-dimension deep-dives (SubGhz, NFC, lineage, changelog, security) |
| `STRATEGY.md`, `FINDINGS.md` | methodology + lab notebook |
| `src/` | the four firmwares as **git submodules**, pinned to analyzed commits |

## Editing (single source → regenerate)
```bash
# edit data/features.json and/or data/structure.json, then:
node build.mjs        # regenerates data/features.js + FEATURE-TREE.md
```
See [data/README.md](data/README.md) for the schema and how to add a
feature / FAP / relation / primitive.

## Firmware sources
```bash
git submodule update --init    # fetch the pinned firmware trees (optional)
```
Submodules pin the exact commits every finding cites, so the repo-relative
`file:line` + commit-hash citations remain verifiable.

## Method, in one line
Code is ground truth; every nontrivial claim cites `file:line` and/or a commit;
changelogs are trusted only after verification; static analysis only.
