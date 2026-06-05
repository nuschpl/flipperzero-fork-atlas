# Provenance & Propagation Ledger

> Cross-fork lineage diagram + per-feature ledger of how each capability
> originated and propagated. Synthesized from sections/lineage.md,
> subghz-protocols.md, subghz-rollingcode.md, subghz-momentum-extras.md,
> nfc-protocols.md, nfc-attacks.md. Every row is backed by working-tree code,
> md5 comparison, and/or path-scoped git history.
> Forks: **O**=official · **U**=unleashed · **R**=roguemaster · **M**=momentum.
> Repo HEADs at analysis time: O `c9ab2b68` (2025-12-01, ~6mo stale), U `318bfc3b`,
> R `ed963fd0`, M `8ed809fb` (all 2026-06-03/04).

---

## 1. Lineage diagram (from lineage.md — CONFIRMED)

```
                  flipperdevices/flipperzero-firmware  (OFFICIAL / OFW)
                  root 46d78a36 "Initial commit" glitchcore 2020-08-01
                                     │  (direct fork; OFW = upstream)
                                     ▼
                  DarkFlippers/unleashed-firmware  (UNLEASHED)
                   shares OFW root 46d78a36; adds DarkFlippers/SubGHz_Remote submodule
                                     │
              ┌──────────────────────┴───────────────────────┐
              │  (unleashed = upstream of both forks)         │
              ▼                                               ▼
 RogueMaster/flipperzero-firmware-wPlugins        Next-Flip/Momentum-Firmware
        (ROGUEMASTER / RM)                          (MOMENTUM, ex-Xtreme)
 unleashed ancestry: shared merge 79f8d7a12        unleashed ancestry: shared
 (2026-02-17); recent unleashed content now        merge 21763ffff (2026-04-29);
 pulled by CONTENT-SYNC (squash), not commit       332+ 'ul/dev' merges; tracks
 merges. Absorbs 9 extra 3rd-party app roots.      OFW directly too (c9ab2b68 IS ancestor).
              ▲                                               │
              └───────────────── cross-pollination ──────────┘
   RM ← Momentum (E6, live): RM merges WillyJL (Momentum lead) PRs (#94, 08e1243ea).
   Momentum ← RogueMaster (E5, historical): Xtreme branched off RM's '420' branch;
   RM-authored commit feccea730 lives in Momentum's DAG, absent from current RM.
```

**Chain:** OFFICIAL → UNLEASHED → {ROGUEMASTER, MOMENTUM}, with bidirectional
RM↔Momentum content cross-pollination, and Momentum's predecessor (Xtreme) having
historically branched off RogueMaster's `420` branch.

| Edge | Verdict | Mechanism | Primary proof |
|---|---|---|---|
| OFFICIAL → UNLEASHED | CONFIRMED | direct fork | shared OFW root `46d78a36`; README self-declares fork |
| UNLEASHED → ROGUEMASTER | CONFIRMED | fork; now content-sync/squash | shared merge `79f8d7a12` (2026-02-17) in RM object store; recent U commits absent in RM |
| UNLEASHED → MOMENTUM | CONFIRMED | fork; live commit merges | shared merge `21763ffff` (2026-04-29); 332 `'ul/dev'` merges |
| OFFICIAL → MOMENTUM (direct) | CONFIRMED | direct OFW tracking | `c9ab2b68` IS ancestor of momentum HEAD; OFW PR merges into `mntm-dev` |
| ROGUEMASTER → (Xtreme→)MOMENTUM | CONFIRMED (historical) | branch absorbed | RM-authored `feccea730` in momentum history, absent in current RM |
| MOMENTUM → ROGUEMASTER | CONFIRMED | PR/content copy | RM merges WillyJL-authored PR #94; commit `08e1243ea` by WillyJL |

**How each fork ingests upstream:**
- **UNLEASHED** = direct git merges of OFW (it is the shared upstream of R and M).
- **MOMENTUM** = closest to U via ongoing commit-level `ul/dev` merges + a parallel direct OFW PR feed.
- **ROGUEMASTER** = U ancestry to Feb-2026 then **squashed content-sync** ("Latest RM…on PATREON" / "UL CHERRYPICKS" commits); absorbs 3rd-party app histories (9 extra roots → 46,862 commits); also pulls Momentum PRs.

---

## 2. Per-feature ledger

Propagation legend: **merge** = identical commit SHAs flow via git merge ·
**squash/content-sync** = re-imported as RM release-snapshot commits (original SHAs
erased) · **verbatim copy** = md5-identical file, no shared per-feature commit ·
**reimplementation** = same feature, divergent code.

### 2a. SubGhz protocols

| Feature | Originating fork | Propagation | Evidence |
|---|---|---|---|
| allstar_firefly, ditec_gol4, elplast, honeywell, nord_ice, treadmill37 | UNLEASHED | U→M merge (shared SHAs); U→R squash/content-sync | U authoring SHAs (`556a2dd3f`, `a5f47e3e6`, etc.) appear in M's path-scoped log; RM history collapses to `225c6895c`/`16e0da353` "UL CHERRYPICKS". md5: R==M, U differs (newer common U state both pulled) |
| keyfinder | UNLEASHED | U→R, U→M | `d18619ff5` (MX); **U=R=M byte-identical** `73023d49…` |
| jarolift (Keeloq deriv., TX) | UNLEASHED | U→M merge; U→R squash | `271c65a96` (MX); shared SHAs `1d32d1de5`/`dfb17ab42`/`eb91b7a97` in U+M; md5 R==M, U differs |
| beninca_arc + aes_common helper | UNLEASHED | U→M merge (verbatim, SW AES); R **reimplemented** AES path | `db2dc8f64` (MX) creates both in U & M (same sole SHA for aes_common). R has NO aes_common; uses HW crypto (`a2cf8be10` Santaniello, `furi_hal_crypto_aes128_ecb_*`). 3-way md5 divergence |
| hormann_bisecur (AES BiSecur, TX) | upstream PR by user890104 (Vencislav Atanasov) | landed in **R and M** via same PR merge; **never in U** | R: `608d2b1d9` "Merge PR #119 from user890104/…hormann-bisecur"; M: per-commit `45999b441`+`e0a427f28`. R==M md5 `3a469b746…` |
| x10 | ROGUEMASTER | R→M (shared Willy-JL/Xtreme commits) | `889674048` (RogueMaster) origin; refined by Willy-JL; R==M md5 `b138402d8…`; decode-only |
| telcoma_edge | ROGUEMASTER (RM-original, **only fork with it**) | none (RM-exclusive) | `529fdbad3` (Benjamin Tamasi) + `149d92ed5`; absent O/U/M; md5 `610fca268…` |
| Weather pack (acurite/oregon/lacrosse/…), TPMS (schrader_gg4, tpms_generic), tx_8300 | rtl_433 (merbanan) → Flipper weather_station app (HTotoo) → **Momentum core-lib** | M core-lib integration unique; R bundles same as external FAP (drifted copy); U fetches from catalog | 24 M core files cite `merbanan/rtl_433`; single integration commit `b9382c912` (HTotoo, 2023-09-20, Xtreme era). M value-add = encoders/TX + filter subsystem + Load/Save |
| POCSAG pager (pocsag, pcsg_generic) | Max Lapan (Flipper pager app) → **Momentum core-lib** | M core-lib; R bundles as app | earliest M SHA `4c092c8e6` (Max Lapan, 2022-11-19); later MX/Willy-JL maintenance |
| SubGhzProtocolFilter enum (Weather/TPMS gating) | MOMENTUM | M→R **header copied, bodies NOT** (vestigial in R) | M `types.h:140-157` + per-file `.filter`; R `types.h:140-157` identical enum but no `.c` references it (R commit `d6a7bb66c3` "SUBG OVERHAUL PT1"). U lacks it entirely |
| Removed: star_line / kia / scher_khan (RU car alarms) | OFFICIAL (deletion originated in UNLEASHED) | U→R, U→M (removal inherited) | U `50b5ee103` "bipki removal procedure" (MX 2026-01-12) deletes all 3 +tests; M relocates to `proto_pirate` ext app |

### 2b. SubGhz rolling-code / TX capability

| Feature | Originating fork | Propagation | Evidence |
|---|---|---|---|
| Keeloq learning/derivation algos (faac, aerf, erreka, pujol, decrypt_derived) — 5 added | UNLEASHED | U→R, U→M (verbatim) | `keeloq_common.c` 127→236 L; **U=R=M byte-identical** `c87b1211…`; `learning_pujol` in U `63d49b6e4` (MX 2026-04-21); FAAC predates |
| Enlarged Keeloq mfg-key keystore (`keeloq_mfcodes`, 62→116 records, **AES-encrypted**) | UNLEASHED | U→R, U→M (verbatim) | **U=R=M byte-identical** `c4d8342f…` (8296 B); record count via loader logic (1 hex line = 1 AES record); plaintext NOT in repo (key in device enclave) |
| RX-only → TX upgrade (faac_slh, somfy_keytis, somfy_telis, nice_flor_s, alutech_at_4n) | UNLEASHED | U→R, U→M | `Send` flag added: O faac_slh.c:64-65 → U :86-88; O alutech_at_4n.c:71 → U :80-81. R/M inherit (md5-identical R/M) |
| Region TX-gate removal / extended YARD-Stick range | UNLEASHED (HAL stub) | U→R, U→M but **R/M reimplemented** as user toggle | U: `furi_hal_region.c:42-45 return true` (always-allow stub), region service deleted. R/M: region retained + `bypass_region`+`extended_range` toggles (default OFF). R/M `check_tx` md5-identical to each other |
| RX `ignore_filter` (protocol allow-filter bypass) | UNLEASHED | U→R, U→M | U `subghz_last_settings.c:16` "IgnoreFilter"; absent in O; R/M inherit |
| Custom buttons block (`custom_btn.c`) | UNLEASHED | U→R, U→M | shared block consumed by keeloq/alutech/nice/somfy/secplus2/came_atomo |

### 2c. NFC protocols & attacks

| Feature | Originating fork | Propagation | Evidence |
|---|---|---|---|
| emv (payment-card protocol stack) | UNLEASHED | U→R, U→M (verbatim) | incremental U commits (`b904555eb` AIP parse, `11cfbd1ec` SFI bruteforce); **U=R=M byte-identical** (7 files) |
| ntag4xx + type_4_tag | UNLEASHED | U→R, U→M (verbatim) | single U commit `fa6839d28` "nfc lib"; **U=R=M byte-identical** (9+14 files) |
| MfUltralight-C 3DES-key-page write (magic emulation key-grab) | UNLEASHED | U→R, U→M (verbatim) | `mf_ultralight_listener.c:204-218` "MAGIC: allow write to ULC key page"; **U=R=M md5 `9fbc7f41…`**, differs from O. RM CHANGELOG credits @haw8411 & under-describes — actually inherited |
| 14 shared transit/payment/lock parsers (charliecard, csc, emv, kazan, metromoney, saflok, sevppk_tk, sk_tk, smartrider, sonicare, szppk_so, ventra, zolotaya_korona[+online]) | UNLEASHED | U→R, U→M | 12/14 **byte-identical** across U/R/M; U holds the feature-commit history |
| ventra.c (CTA station DB superset) | ROGUEMASTER (patch on U base) | R-local | R md5 `4118789a…` differs from U=M `aaa715a9…`; R header "FatherDivine" |
| smartrider.c (reformat/edit) | MOMENTUM (patch on U base) | M-local | M md5 `f25e33a6…` differs from U=R `4cd4a73e…` |
| andalucia, trea, hotels parsers | ROGUEMASTER (RM-only) | none (RM-exclusive) | `ca06e4d05` "ADD CTAS ANDALUCIA", `0252da598` "ADD TREA", `ea419796c` "PR 4323". hotels = parse-only stub |
| mfkey app (mfkey32 + static_nested) | upstream noproto/FlipperMfkey | vendored in U/R/M | U=R `mfkey.c` md5-identical `dfbbf807…`; M slightly newer; crypto1 core byte-identical all 3 |
| mf_classic_dict.nfc (key dictionary) | Proxmark3/Iceman base, fork-extended | U largest; **R and M share identical key set** | U 4082 keys; R=M 2475 keys (key-only diff EMPTY; differ only by comment case) → shared-origin curated dict |
| nfc_magic (Gen1A/B/Gen2/Gen4 GTU writer) | upstream OFW nfc_magic | vendored in **R and M only** (not U) | R=M `gen4_poller.c` **byte-identical** `0d77609f…`; U/O ship none in-tree |
| NFC Fuzzer / Sniffer / Relay / Dict Manager | community apps catalog | **RM-only in-tree** | RM `application.fam` names; broadest in-tree NFC attack surface |
| ProtoPirate (car/rolling-code SubGhz ext app) | community (RocketGod/xMasterX/zero-mega et al.) | **M-bundled** in tree (absent from current U/R/O trees) | M `applications/external/proto_pirate/`; houses relocated star_line/scher_khan/kia + aut64/chrysler/ford/honda/… |

---

## 3. Copies WITHOUT git ancestry (md5-identical files lacking shared per-feature commits)

These are the strongest "manual-copy / squash-import" signals — files that are
byte-identical across forks but whose introducing commit SHAs are **not** shared
(because RogueMaster squashes upstream into dated release snapshots, erasing the
original per-feature commit identity). md5 equality proves shared origin even where
git ancestry is absent.

| File(s) | Identical across | Shared per-feature commit? | Interpretation |
|---|---|---|---|
| `lib/subghz/protocols/keeloq_common.c` | U=R=M (`c87b1211…`) | U has authoring SHAs; **R lacks them** (squashed) | RM obtained via content-sync, not cherry-pick — file identical but no shared SHA in RM |
| `assets/.../keeloq_mfcodes` (encrypted keystore) | U=R=M (`c4d8342f…`) | binary asset, no per-line history | identical enlarged keystore copied verbatim into R/M |
| `keyfinder.c` | U=R=M (`73023d49…`) | U authoring SHA absent in RM | verbatim/squash copy into RM |
| emv/ (7 files), ntag4xx/ (9), type_4_tag/ (14) | U=R=M | U incremental SHAs; RM squashed | 30 NFC files copied verbatim; RM lacks the granular U commits |
| `mf_ultralight_listener.c` | U=R=M (`9fbc7f41…`) | RM squashed | inherited magic ULC key-grab; RM credits it as RM/@haw8411 work |
| `mfkey/mfkey.c` | U=R (`dfbbf807…`); M differs (`e11dbacd…`) | shared upstream noproto app | U & R pinned same rev; M on newer rev; crypto1.c identical all 3 |
| `nfc_magic/.../gen4_poller.c` | R=M (`0d77609f…`); absent in U/O tree | shared upstream nfc_magic | R & M independently vendor the same upstream app (no U intermediary in-tree) |
| `mf_classic_dict.nfc` (key set) | R=M (identical key set, comment-case differs) | curated dict, no commit-level lineage | R and M share the exact 2475-key curated dictionary; cosmetic post-processing only |
| rolling-code protocols (jarolift, hormann_bisecur, faac_slh, secplus_v1/v2, somfy_*, nice_flor_s, alutech_at_4n) | R=M byte-identical (each) | RM squashed; M has SHAs | R and M ship identical rolling-code source; R via content-sync, M via U merge |
| `lib/subghz/types.h` SubGhzProtocolFilter enum | M=R (enum block identical) | M-origin; R copied header only | R copied the enum (R `d6a7bb66c3`) WITHOUT the protocol bodies → **vestigial dead enum in R** — a clear "header copied without implementation" signature |

**Direction inference from md5:** where R==M but U differs, both pulled a newer
common Unleashed state (Momentum's own history carries the upstream U SHAs, so it
tracks U directly rather than copying R). Where R copies a Momentum-origin construct
(SubGhzProtocolFilter), the copy is partial/vestigial — confirming the E6
Momentum→RM cross-pollination edge at file granularity.

---

## 4. Confidence

- Lineage edges (§1): **high** — each rests on a shared commit hash or named-author commit, cross-checked across object stores.
- md5-identical / divergence claims (§2, §3): **high/certain** — read directly from working tree.
- Propagation mechanism (U→M merge with shared SHAs vs U→R squash): **high** — based on matching/absent path-scoped SHAs and RM's squashed release-snapshot subjects.
- Weather/TPMS/POCSAG = rtl_433/Max-Lapan ports (not fork-original): **high** — 24 files cite merbanan/rtl_433; single Xtreme-era integration commit.
- Caveat: OFW HEAD `c9ab2b68` is ~6mo stale; "absent in O" for ntag4xx/type_4_tag/parsers reflects the pinned baseline (some may have since landed upstream). The car-alarm *removal* and the fork *additions/encryptions* are robust regardless of baseline age.
