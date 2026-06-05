# Fork Lineage Graph (Phase B)

> Status: **CONFIRMED** (2026-06-05). Every edge below is backed by git ancestry
> (shared commit hashes), README prose, and submodule/file fingerprints. All
> claims verified against the working-tree repos and path-scoped git history.
> Repo HEADs at analysis time: official `c9ab2b68` (2025-12-01), unleashed
> `318bfc3b` (2026-06-04), roguemaster `ed963fd0` (2026-06-04), momentum
> `8ed809fb` (2026-06-03).

## TL;DR diagram

```
                      flipperdevices/flipperzero-firmware  (OFFICIAL / OFW)
                      root 46d78a36 "Initial commit" glitchcore 2020-08-01
                                         │
                                         │  (direct fork; OFW = upstream)
                                         ▼
                      DarkFlippers/unleashed-firmware  (UNLEASHED)
                       shares OFW root 46d78a36; adds DarkFlippers/SubGHz_Remote
                                         │
                  ┌──────────────────────┴───────────────────────┐
                  │  (unleashed = upstream of both forks)         │
                  ▼                                               ▼
   RogueMaster/flipperzero-firmware-wPlugins        Next-Flip/Momentum-Firmware
            (ROGUEMASTER / RM)                        (MOMENTUM, ex-Xtreme)
   unleashed ancestry: shared merge 79f8d7a12        unleashed ancestry: shared
   (2026-02-17). Recent unleashed content now        merge 21763ffff (2026-04-29);
   pulled by CONTENT-SYNC (squash), not commit       332+ "Merge ... 'ul/dev'"
   merges. Absorbs many 3rd-party app histories      commits. Tracks OFW directly
   (multiple extra root commits).                    too (c9ab2b68 IS ancestor).
                  ▲                                               │
                  │                                               │
                  └───────────────── cross-pollination ──────────┘
       RM ← Momentum: RM merges PRs authored by WillyJL (Momentum lead),
       e.g. RM PR #94 "fix/revert-ai-slop" + commit 08e1243ea
       "sync to Unleashed" authored by WillyJL <me@willyjl.dev>.

       HISTORICAL: Momentum's deep history passed THROUGH RogueMaster's
       '420' branch during the Xtreme era (see Edge E5).
```

Lineage chain (left = oldest): **OFFICIAL → UNLEASHED → {ROGUEMASTER, MOMENTUM}**,
with bidirectional content cross-pollination between RM and Momentum, and
Momentum's predecessor (Xtreme) having branched off RogueMaster's `420` branch
historically.

---

## Shared root commit (all four)

All four repos share the **identical** initial commit — the genuine OFW root:

| Repo | `rev-parse 46d78a36^{commit}` |
|---|---|
| official | `46d78a3604012f1712d8176846ac6096faf83ed8` |
| unleashed | `46d78a3604012f1712d8176846ac6096faf83ed8` |
| roguemaster | `46d78a3604012f1712d8176846ac6096faf83ed8` |
| momentum | `46d78a3604012f1712d8176846ac6096faf83ed8` |

Root commit: `46d78a36` "Initial commit", **glitchcore <mail@s3f.ru>**,
2020-08-01 — the original flipperzero-firmware genesis commit. Identical hash ⇒
identical content + identical ancestry ⇒ every fork descends from OFW.

RogueMaster additionally has **9 extra root commits** (parentless), e.g.
`4e7a1e421` Konstantin Oblaukhov 2012, `56177f0e1` Kosma Moczek 2014,
`db0d084b7` 2016, `04fb83449` Invizabel 2021, `4018a16e4` Etienne Sellan 2022.
These are *absorbed third-party app/library histories* (subtree/`git read-tree`
merges of external Flipper apps), **not** alternate firmware bases. They explain
RM's huge commit count (46,862) but do not change the firmware lineage.

---

## Edge evidence

| Edge | Verdict | Mechanism | Primary proof |
|---|---|---|---|
| E1: OFFICIAL → UNLEASHED | **CONFIRMED** | direct fork | shared OFW root `46d78a36`; README self-declares fork of flipperdevices |
| E2: UNLEASHED → ROGUEMASTER | **CONFIRMED** | fork; now content-sync | shared unleashed merge `79f8d7a12` (MMX, 2026-02-17) present in RM |
| E3: UNLEASHED → MOMENTUM | **CONFIRMED** | fork; live commit merges | shared unleashed merge `21763ffff` (MMX, 2026-04-29); 332+ `'ul/dev'` merges |
| E4: OFFICIAL → MOMENTUM (direct) | **CONFIRMED** | direct OFW tracking | `c9ab2b68` (official HEAD) **IS ancestor** of momentum HEAD |
| E5: ROGUEMASTER → (Xtreme→)MOMENTUM | **CONFIRMED (historical)** | branch absorbed | RM-authored commit `feccea730` exists in momentum history, absent in current RM |
| E6: MOMENTUM → ROGUEMASTER | **CONFIRMED** | PR / content copy | RM merges WillyJL-authored PRs (#94); commit `08e1243ea` authored by WillyJL |

### E1 — OFFICIAL → UNLEASHED (CONFIRMED, direct fork)
- README, unleashed `ReadMe.md:16`: *"This firmware is a fork of the original
  (OFW) version of flipperdevices/flipperzero-firmware …"*.
- Shared OFW root `46d78a36` (table above) ⇒ unleashed is a true git descendant
  of OFW, not a reimplementation.
- Distinctive divergence marker: unleashed adds a fork-specific submodule absent
  in OFW — `unleashed-firmware/.gitmodules`: `applications/main/subghz_remote` →
  `https://github.com/DarkFlippers/SubGHz_Remote.git` (branch `ufw_main_app`).
  This `DarkFlippers/SubGHz_Remote` submodule is **present only in unleashed's**
  `.gitmodules` (not in RM or momentum — they inline that app instead), a clean
  unleashed identity fingerprint.

### E2 — UNLEASHED → ROGUEMASTER (CONFIRMED)
- README, roguemaster `ReadMe.md:9`: *"This firmware is a fork of all Flipper
  Zero community projects!"* and lists Unleashed as a source ("Last
  Synced/Checked Unleashed").
- **Git ancestry proof:** unleashed merge commit
  `79f8d7a12d1a87977c206483e5b83531ef6d1fc2` (MMX, "Merge pull request #968 from
  Dmitry422/dev", 2026-02-17) is present **byte-identical in RM's object store**
  (`git -C roguemaster-firmware cat-file -t 79f8d7a12` ⇒ commit). This is the
  newest unleashed *commit* shared with RM in the last ~120 unleashed merges.
- **Sync mechanism shifted to content-copy:** RM's *recent* HEAD does **not**
  contain unleashed's latest commits — `318bfc3b`, `78cbcab36`, `c5bcab305`,
  `44ff715a3`, `41628a4ce` … (unleashed's last 8) are all **absent** in RM. RM
  instead ingests unleashed content via squashed/rewritten commits, e.g.
  `08e1243ea` "Sub-GHz: Revert protocol diffs from old OFW PR, **sync to
  Unleashed**". So RM's *git ancestry* to unleashed is real but lags
  (Feb 2026); its *current* unleashed parity is maintained by manual/PR content
  syncs rather than ongoing commit-level merges.
- RM-unique tooling fingerprints (present only in RM): `Brewfile`,
  `buildRelease.sh`, `GAMES_ONLY.md`, `RoadMap.md`, and extra submodules
  (`lib/littlefs`, `lib/uzlib`, `applications/external/dap_link/lib/free-dap`).

### E3 — UNLEASHED → MOMENTUM (CONFIRMED, live)
- README, momentum `ReadMe.md:16`: *"based on the Official Firmware … and
  includes most of the awesome features from Unleashed … a direct continuation
  of the Xtreme firmware."*
- **Git ancestry proof:** unleashed merge `21763ffffe90bffb3f566a9a93c5c505b22d1f7f`
  (MMX, "Merge pull request #996 from hryamzik/ptt-zoom-improvements",
  2026-04-29) is present byte-identical in momentum.
- **Live integration:** momentum has **332** merge commits matching
  `'ul/dev'`/unleashed (`git log --merges | grep -c`), e.g. repeated
  `Merge remote-tracking branch 'ul/dev' into mntm-dev` (`d8a644e3e`,
  `853ccce7d`, `97617404d`, `6941068e6` …). `ul` is momentum's remote alias for
  unleashed. Momentum is the fork that stays *closest* to unleashed by ongoing
  commit-level merges.

### E4 — OFFICIAL → MOMENTUM (CONFIRMED, direct upstream tracking)
- Momentum tracks OFW **directly**, not only via unleashed:
  `git -C momentum-firmware merge-base --is-ancestor c9ab2b68 HEAD` ⇒ true.
  Official's current local HEAD `c9ab2b68` is a literal ancestor of momentum
  HEAD. (Contrast: that same hash is "NO-COMMIT" / not-fetched in unleashed and
  RM, because their OFW sync points differ.)
- Momentum's merge log mixes OFW PR merges (`abe7a38bb` #984, `86d850400` #981,
  `605df88d4` #989) directly into `mntm-dev`, confirming a parallel OFW upstream
  feed alongside the unleashed feed.
- Distinctive momentum identity: it is the only fork that submodules its app set
  — `momentum-firmware/.gitmodules`: `applications/external` →
  `https://github.com/Next-Flip/Momentum-Apps.git`; and forks the protobuf to
  `Next-Flip/flipperzero-protobuf.git`. (official/unleashed/RM inline their apps.)

### E5 — ROGUEMASTER → MOMENTUM (CONFIRMED, historical, via Xtreme)
- Momentum is the continuation of **Xtreme** (README: *"direct continuation of
  the Xtreme firmware"*). Momentum's deep history exposes the Xtreme chain:
  merges from `https://github.com/ClaraCrazy/Flipper-Xtreme` (`ca7e285d2`,
  `0512339fd`, `f1052dd1a`) and `https://github.com/Flipper-XFW/Xtreme-Firmware`
  (`2270f92ec`, `a18c75709`).
- **Cross-fork ancestry proof:** commit `feccea73012f2c4504b4f87530031266bc92611a`
  "Merge branch 'UNLEASHED' into 420", authored by **RogueMaster
  <anifan115@gmail.com>** (2022-09-19), exists **in momentum's history** but is
  **ABSENT in the current RogueMaster repo**. Momentum's history also contains
  many `Merge branch '420' of …/RogueMaster/flipperzero-firmware-wPlugins`
  commits (`f4936672d`, `19aba7997`) and `upd wplugins`/`fetch wplugins`
  (`fec752331`, `4760c1c5c`). ⇒ Early Xtreme branched off RogueMaster's `420`
  branch (which itself merged UNLEASHED), so Momentum's lineage *passed through*
  RogueMaster historically. This is why a RogueMaster-authored commit lives in
  Momentum's DAG. The "420" branch is RM's signature branch name.

### E6 — MOMENTUM → ROGUEMASTER (CONFIRMED, ongoing cross-pollination)
- RM pulls code authored by Momentum's lead dev **WillyJL**:
  - `08e1243ea` "Sub-GHz: Revert protocol diffs from old OFW PR, sync to
    Unleashed" — author **WillyJL <me@willyjl.dev>** (2026-06-03), sitting in
    RM's recent history.
  - `2dd73efea` "Merge pull request #94 from **WillyJL**/fix/revert-ai-slop"
    (merged by Luu, 2026-06-04).
- ⇒ RM ("fork of *all* community projects") actively ingests Momentum/WillyJL
  contributions. This is content/PR-level cross-pollination, not a clean
  unidirectional fork edge.

---

## How each fork ingests upstream (summary)

| Fork | OFW intake | Unleashed intake | Other |
|---|---|---|---|
| UNLEASHED | direct git merges of OFW | — (is the upstream) | own `SubGHz_Remote` submodule |
| MOMENTUM | direct OFW PR merges into `mntm-dev` (E4) | live `ul/dev` merges, 332+ (E3) | continuation of Xtreme; own Momentum-Apps submodule |
| ROGUEMASTER | indirect (via unleashed) + content syncs | git ancestry to Feb-2026 (`79f8d7a12`) + ongoing **content-sync/squash** (E2) | absorbs 3rd-party app histories (9 extra roots); pulls Momentum PRs (E6) |

## Confidence notes / caveats
- **High confidence** on all six edges: each rests on a shared commit hash
  (E1/E2/E3/E4/E5) or a named-author commit (E6), cross-checked against the other
  repos' object stores.
- The OFW clone is ~6 months stale (HEAD 2025-12-01). E4 used official's local
  HEAD `c9ab2b68` as an *ancestor* test — valid for proving momentum descends
  from OFW; it does not bound how *current* momentum is vs live OFW `dev`.
- RM's "shared unleashed commit" is from Feb 2026; RM keeps closer parity than
  that via content copies whose individual upstream commit identities are erased
  by squashing — so RM↔unleashed *commit-level* drift overstates the real code
  drift. Code-level parity is examined in the SubGhz/NFC deep-dive sections.
- E5 (RM→Momentum) is **historical** (Xtreme era, 2022). It does not mean
  today's Momentum pulls from today's RM; the live cross-pollination flows the
  other way (E6, Momentum→RM).
