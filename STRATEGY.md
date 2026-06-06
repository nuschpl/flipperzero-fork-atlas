# Flipper Zero Firmware Fork Analysis — Strategy

> Status: **DRAFT v1** (2026-06-05). This is a living document. If a phase's
> method proves wrong or too costly mid-flight, STOP, revise this file, and
> restart from the revised step. Do not silently improvise around a broken plan.

## 0. Goal (what "done" looks like)

Produce an evidence-backed map of how four Flipper Zero firmwares relate, with
emphasis on **NFC** and **SubGhz** layers and **unique features**. Specifically:

1. **Lineage & provenance** — who forked from whom; who cherry-picked / copied
   what from whom, including copies done *without* git ancestry (manual
   re-implementation, rewritten commit messages, renamed files).
2. **Unique features per fork** — what each adds that the others lack, traceable
   in a completeness **feature tree** (`FEATURE-TREE.md`).
3. **Changelog trust audit** — reconcile each project's advertised changelog /
   feature list against the actual code. Flag (a) advertised-but-absent and
   (b) present-but-undocumented changes.
4. **Security / abuse audit** — hunt for malicious or covert behavior:
   - Covert exfiltration via radio side channels (BLE/GATT, SubGhz TX, IR, RFID,
     UART to companion) of captured secrets without clear user intent.
   - Telemetry / phone-home (URLs, IPs, domains, analytics).
   - Suspicious-but-not-provably-malicious logic (flag, don't convict).
   - Anti-analysis / obfuscation (encoded blobs, hidden menus, time bombs).
5. **Sensitive capability exposure** — how each firmware ships/handles:
   - Hardcoded **Keeloq** manufacturer keys (car/gate rolling-code secrets).
   - Car-key / rolling-code **decoding** (e.g. Keeloq learning, Somfy, Nice,
     Hörmann BiSecur, AES-based remotes).
   - NFC key material (MIFARE Classic dictionaries, mfkey/nested recovery,
     magic-card writing, transport/car keys).

The four subjects:

| Tag | Repo | Role (hypothesis) |
|-----|------|-------------------|
| `official` | flipperdevices/flipperzero-firmware | upstream base |
| `unleashed` | DarkFlippers/unleashed-firmware | 1st-order fork of official |
| `roguemaster` | RogueMaster/flipperzero-firmware-wPlugins | fork of unleashed + apps |
| `momentum` | Next-Flip/Momentum-Firmware | fork of unleashed (ex-Xtreme) |

## 1. Constraints & ground truth (recon, 2026-06-05)

- All four repos were **shallow `--depth 1`** clones. ✅ **RESOLVED**: converted
  all four to **partial clones (`--filter=blob:none`) and unshallowed** — full
  commit graph, blobs fetched lazily. Measured cost (cheap!):
  - official 2,736 commits, .git 82 M
  - unleashed 8,163 commits, .git 270 M
  - roguemaster 46,862 commits, .git 792 M
  - momentum 15,274 commits, .git 282 M (non-fatal promisor error on 1 object
    during unshallow; verified usable — `git fetch --refetch` available if ever
    needed, but not worth the cost now). Free disk still ~19 Gi. Total .git ~1.4 G.
- **Disk** (~20 GiB free) is comfortable under blob:none. Guardrail still active:
  never run unscoped `git log -p` / `git grep` over full history (would trigger a
  blob-fetch storm); always **path-scope** queries. Hard-stop at ~5 GiB free.
- **Tooling correction:** plain **`git` is NOT blocked** — only the `gh` CLI is.
  So ALL code/history work (full history, diffs, blame, `patch-id`, `range-diff`,
  fetching specific commits/trees across repos over HTTPS) uses `git` directly.
  `WebFetch` is reserved ONLY for GitHub metadata that does *not* live in the git
  repo: PR/issue threads, release-page changelogs, repo/marketing descriptions.
- Malware-safety rules (global CLAUDE.md): **static analysis only**. No `r2 -d`,
  `-R`, `-i` on any binary sample. We analyze *source*; if a prebuilt `.fap`/blob
  needs inspection, do it statically and ask before any dynamic step.

HEADs at recon time:
- official `c9ab2b6` (2025-12-01) — note: *older* than the forks' HEADs.
- unleashed `318bfc3` (2026-06-04)
- roguemaster `ed963fd0` (2026-06-04)
- momentum `8ed809f` (2026-06-03)

> ⚠️ The official clone is 6 months behind the forks. Before concluding "fork X
> has feature Y that official lacks," confirm against *current* official (web or
> a fresh fetch of official's main), else we'll mis-attribute upstream features.

## 2. Method principles

- **Code state is ground truth; git history is the story.** Always confirm a
  difference exists in the *current tree* (diff of files) before spending budget
  tracing *when/who* introduced it.
- **Trust nothing advertised.** Every changelog claim is a hypothesis to verify
  against code. Every "this is unique to us" is checked against the other three.
- **Detect manual copies, not just cherry-picks.** Git ancestry misses
  copy-paste. Cross-check with: normalized-content equality, `git patch-id`,
  distinctive comments/strings/typos that travel with copied code, identical
  magic constants/tables, file-rename heuristics.
- **Narrow the security search by diffing against baseline.** Fork-introduced
  code = (fork tree) − (official tree). Audit *that* delta for comms/exfil, not
  the whole 100k-file tree.
- **Flag, don't convict.** Suspicious ≠ malicious. Record uncertainty level.
- **Everything is traceable.** Each claim in deliverables cites file:line and/or
  commit hash so a reviewer can re-verify.

## 3. History acquisition plan — REALIZED

✅ Done: all four converted to partial clone + unshallowed (see §1 for sizes).
Full commit graph available locally; source blobs hydrate lazily on diff.

Remaining sub-steps:
1. **Refresh official to current** (HEAD is 6 mo stale, Dec 2025) before any
   "fork has X, official lacks X" claim: `git -C src/official-firmware fetch
   origin` and compare against current `origin/dev`/`origin/release`, not the
   stale local HEAD. Mitigates mis-attribution (R1).
2. **Cross-fork provenance method (cache-based, disk + token efficient):**
   instead of merging all repos into one object store, build **on-disk metadata
   indexes** under `cache/` and join them with `grep`/`comm`/`sort`:
   - `git log --oneline --follow -- <path>` per target path, per repo.
   - **patch-id index**: `git log --format=%H -- <path> | while read c; do
     git show $c -- <path> | git patch-id --stable; done` → maps `patch-id → commit`.
     Identical patch-id across repos == identical change content (catches both
     cherry-picks AND verbatim manual copies that preserve the diff).
   - For *rewritten* copies (patch-id differs) fall back to **content
     fingerprinting**: normalized blob hashes, distinctive constants/tables,
     comment/typo signatures that travel with copied code.
   Build these **incrementally per investigation** (not all-history upfront) to
   avoid blob-fetch storms and keep outputs small.
3. **Unified repo (only if needed):** if a question truly needs cross-repo
   `merge-base`/`range-diff`, create a scratch repo using
   `objects/info/alternates` pointing at all four `.git/objects` (zero-copy) and
   fetch only refs. Defer until required.
4. **Hard stop**: free disk < ~5 GiB → stop fetching, revise, switch to web.

## 4. Phased execution

### Phase A — Surface inventory (cheap, mostly done)
- Enumerate SubGhz protocols, NFC protocols, external apps per fork. Diff sets.
- Record counts + per-fork extras. (Initial pass complete — see FEATURE-TREE.md.)
- Identify the high-value targets confirmed so far: expanded `keeloq_common.c`
  (236 vs 127 lines), Momentum weather/TPMS protocol pack, RM `hormann_bisecur`
  / `telcoma_edge` / `x10`, bundled `nfc_magic` in RM+Momentum.

### Phase B — Lineage skeleton
- Confirm fork base of each (read READMEs, `.github`, submodule sets, distinctive
  upstream merge commits once history is available).
- Establish the directed graph official → … with evidence per edge.

### Phase C — SubGhz deep dive
- Per added protocol: origin (which fork first), decoder/encoder presence,
  whether it enables TX of others' captures, rolling-code handling.
- **Keeloq focus**: diff `keeloq_common.c` / `keeloq.c` across forks; catalog the
  added manufacturer keys (brands, count); determine read-only-decode vs
  full-clone/TX; check region/TX-restriction removal.
- Detect copied-vs-reimplemented protocols (content + comment fingerprinting).

### Phase D — NFC deep dive
- Protocol coverage diff (felica/iso/mf_* /slix/st25tb + fork additions).
- Key recovery: mfkey32/mfkey64/nested/hardnested/static-nested presence & origin.
- MIFARE Classic dictionary (`mf_classic_dict.nfc`) size/content diff (key count).
- Magic-card support (`nfc_magic`), emulation scope, transport/car-key parsers.

### Phase E — Changelog trust audit
- Pull each project's changelog/release notes/feature list (web).
- For a sampled set of claims, verify in code (present? as described?).
- Hunt undocumented additions: fork-delta files with no changelog mention.

### Phase F — Security / abuse audit (the careful one)
- Build fork-delta file lists vs current official.
- Static indicator sweep over deltas: `http(s)://`, IPs, domains, `furi_hal_bt`,
  GAP/GATT advertising with payloads, `subghz_tx`, UART writes, base64/xor,
  large embedded blobs, `system(`/exec-like, hidden/debug menus, date/time gates.
- Triage hits; for each candidate, read surrounding logic and classify:
  benign / telemetry / suspicious / likely-malicious, with confidence + evidence.
- Special attention: any path that takes *captured secrets* (keys, rolling codes,
  card dumps) and *emits them over a radio/UART* without explicit user action.

### Phase G — Synthesis
- Finalize `FEATURE-TREE.md` (completeness matrix), `PROVENANCE.md` (lineage +
  cherry-pick/copy ledger), `SECURITY.md` (findings + confidence), and a
  top-level `REPORT.md` executive summary.

## 5. Deliverables (files in ``)

- `STRATEGY.md` — this file.
- `FEATURE-TREE.md` — hierarchical feature matrix across the 4 forks (the
  completeness backbone; every leaf marked ✓/✗/partial + provenance note).
- `PROVENANCE.md` — lineage graph + per-feature "who first / who copied / how
  (cherry-pick vs manual)" ledger with evidence.
- `SECURITY.md` — security/abuse findings, each with severity, confidence,
  file:line/commit, and reasoning (incl. ruled-out items).
- `CHANGELOG-AUDIT.md` — advertised vs actual reconciliation.
- `FINDINGS.md` — running raw lab notebook (timestamped observations, commands).
- `REPORT.md` — executive synthesis (last).

## 6. Open decisions / risks

- **D1 (disk):** Confirm with user whether to (a) attempt blob-less unshallow of
  official+unleashed only [recommended], or (b) free disk first to allow deeper
  history, or (c) stay web-only for all provenance. ← needs user input.
- **R1:** Stale official clone could cause mis-attribution → mitigated by §3.2.
- **R2:** RM/Momentum history may be too large to fetch → web fallback (§3.3b).
- **R3:** Manual copies are inherently fuzzy to attribute → report confidence,
  never overstate.
