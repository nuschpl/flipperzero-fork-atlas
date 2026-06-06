# Lab Notebook (raw, timestamped)

Append-only running log. Conclusions get promoted to REPORT/SECURITY/PROVENANCE.

---

## 2026-06-05 — Recon & history acquisition
- 4 repos in `src/`. Were depth-1 shallow → converted to **partial clone
  (`--filter=blob:none`) + unshallow**. Sizes: official 2736c/82M,
  unleashed 8163c/270M, roguemaster 46862c/792M, momentum 15274c/282M.
  Free disk steady ~19–20Gi. Momentum: 1 non-fatal promisor object error,
  history verified usable.
- official local HEAD `c9ab2b6` is **2025-12-01** = ~6mo stale vs forks (Jun 2026).
  MUST refresh before "official lacks X" claims.
- `gh` blocked; plain `git` is NOT. Use git for all repo/history ops; WebFetch
  only for off-repo GitHub prose (PRs/issues/release notes).

### SubGhz protocol inventory (`lib/subghz/protocols/*.c`)
Counts: O=55, U=62, R=64, M=94.
- U adds (vs O): aes_common, allstar_firefly, beninca_arc, ditec_gol4, elplast,
  honeywell, jarolift, keyfinder, nord_ice, treadmill37.
- R adds (vs O): U's set (aes_common appears via different path? verify) +
  hormann_bisecur, telcoma_edge, x10.
- M adds (vs O): U's set + hormann_bisecur, x10 + LARGE weather/TPMS/pager pack
  (acurite*, oregon*, lacrosse*, ambient_weather, auriol*, bresser_3ch,
  emos_e601x, gt_wt_0x, infactory, kedsum_th, nexus_th, solight_te44,
  thermopro_tx4, vauno_en8822c, wendox_w6726, ws_generic, schrader_gg4,
  tpms_generic, pocsag, pcsg_generic, tx_8300).
- telcoma_edge = **RM-only** so far.

## 2026-06-05 — Keeloq deep dive (Phase C sample, validates method)
### Capability: `lib/subghz/protocols/keeloq_common.c`
- md5: official `cd20cc1e…` ; U=R=M all `c87b1211…` (**identical across forks**).
- Delta O→U (127→236 lines) = **added rolling-code LEARNING/derivation algos**,
  not a static key list:
  `faac_learning`, `manufacturer_nl_extend`, `decrypt_derived`,
  `learning_aerf`, `learning_erreka`, `learning_pujol`.
  → expands ability to derive per-manufacturer keys & clone rolling remotes.
- Provenance (pickaxe on `learning_pujol`): unleashed commit `63d49b6e4`
  "subghz upgrades [ci skip]" by **MX**, 2026-04-21 (omnibus/squashed-style
  commit — note: unleashed bundles many changes into opaque "subghz upgrades"
  commits; granular attribution partly obscured). Older learning fns (faac)
  predate this. R & M carry byte-identical file → inherited from U (verify
  cherry-pick vs merge in PROVENANCE).

### Sensitive data: manufacturer key table `…/assets/keeloq_mfcodes`
- Size: **official 4466 B → U=R=M 8296 B** (byte-identical across forks).
  ~doubled → forks ship a larger manufacturer-key set.
- **Format = "Flipper SubGhz Keystore File", `Encryption: 1` with IV** →
  the keys are **AES-encrypted at rest**, NOT plaintext in the repo. Decryption
  needs the Flipper's device/factory key. So: repo does NOT expose plaintext
  Keeloq keys; it ships a larger *encrypted* keystore. (Community knows the
  plaintext keys independently, but that's outside the repo.) ← important nuance
  for the "hardcoded keys" question: present-but-encrypted, not leaked-in-clear.
- `keeloq_mfcodes_user.example` (plaintext template for user-added keys):
  official 576 B → forks 723 B. Inspect for any example *real* keys (TODO).

### Open Keeloq TODOs
- [x] Decode count of entries in encrypted keystore → **DONE**: loader decrypts
      ONE record per hex line (subghz_keystore.c:131-166, sscanf man:type:name).
      So #records == #hex lines. **O=62, U=R=M=116** (forks byte-identical).
      See sections/subghz-rollingcode.md §2.2.
- [ ] Confirm R/M obtained keeloq_common.c via cherry-pick (same patch-id) vs
      verbatim copy (merge) — run patch-id compare. (deferred to PROVENANCE)
- [x] Check `keeloq_mfcodes_user.example` delta → **DONE**: pure placeholders
      (AABBCCDDEEFFAABB:1:TestN) in ALL forks; fork delta = expanded comments
      only (documents learning method IDs 5-8). No real keys. §2.3.
- [x] TX/region restriction removal → **DONE**: §3. U = region HAL gutted to
      always-allow stub (furi_hal_region.c:42-45 `return true`) + YARD Stick
      range widen; R/M = region kept but user-toggle `bypass_region`+`extended_range`
      (default OFF, SD opt-in). Official mandatory region TX gate removed/bypassed
      in all forks. Plus RX-side `ignore_filter` added in all 3.

## 2026-06-05 — SubGhz rolling-code/TX section written
- sections/subghz-rollingcode.md. Key NEW findings beyond Keeloq:
  - **Decode→TX upgrade**: forks add SubGhzProtocolFlag_Send to faac_slh,
    somfy_keytis, somfy_telis, nice_flor_s, alutech_at_4n (official = decode-only).
    +jarolift (all), +hormann_bisecur (R/M only).
  - **Removed protocols**: star_line, kia, scher_khan deleted from ALL forks via
    unleashed `50b5ee103` "bipki removal procedure" (MX 2026-01-12, "they are in
    other app"). Were decode-only anyway → de-scoping, not capability loss.
  - keeloq_common: +5 learning algos (faac, aerf, erreka, pujol, decrypt_derived),
    U=R=M byte-identical.
  - R==M ship byte-identical source for every rolling-code protocol checked.
