# Flipper Zero Firmware — Comparative Analysis Report

> Executive synthesis of four Flipper Zero firmwares: OFFICIAL (OFW), UNLEASHED,
> ROGUEMASTER, MOMENTUM (ex-Xtreme). Focus: NFC and SubGhz capability, lineage,
> code provenance, changelog trustworthiness, and security posture.
> Static analysis only. Code is ground truth; every nontrivial claim is cited to a
> section file (which carries file:line + commit/md5 evidence).
> Repo HEADs: O `c9ab2b68` (2025-12-01, ~6mo stale), U `318bfc3b`, R `ed963fd0`,
> M `8ed809fb` (all early Jun 2026). Detail sources in `sections/*.md`.

---

## (a) How the four forks relate

The hypothesized lineage **OFFICIAL -> UNLEASHED -> {ROGUEMASTER, MOMENTUM}** is
**confirmed** by shared git ancestry, README prose, and file fingerprints
(sections/lineage.md). All four repos share the identical genuine OFW root commit
`46d78a36` (glitchcore, 2020-08-01).

- **UNLEASHED** is a direct fork of OFW and is the shared upstream of both downstream forks.
- **MOMENTUM** stays closest to Unleashed via ongoing commit-level merges (332 `ul/dev` merges, shared merge `21763ffff`) **and** tracks OFW directly in parallel (OFW HEAD `c9ab2b68` is a literal ancestor of Momentum HEAD; OFW PRs merged into `mntm-dev`). Momentum is the continuation of **Xtreme**.
- **ROGUEMASTER** has Unleashed ancestry up to Feb-2026 (shared merge `79f8d7a12`), then shifts to **squashed content-sync** ("Latest RM...on PATREON" / "UL CHERRYPICKS" commits) that erases per-feature commit identity. It absorbs many third-party app histories (9 extra root commits -> 46,862 commits) and is best described as "Unleashed + a very large bundled external-app pack."

There is **bidirectional cross-pollination between RM and Momentum**: today RM
pulls Momentum-lead WillyJL's PRs (e.g. #94, commit `08e1243ea`); historically,
Xtreme (Momentum's predecessor) branched off RogueMaster's `420` branch, so a
RogueMaster-authored commit (`feccea730`) lives in Momentum's DAG. The live flow is
Momentum->RM; the RM->Momentum edge is historical (Xtreme era, 2022).

---

## (b) Who cherry-picked / copied what from whom

Detailed ledger in PROVENANCE.md. Summary of mechanisms:

- **Unleashed is the source of almost all SubGhz/NFC capability** that the forks add over OFW: the 9-protocol gate pack (allstar_firefly, ditec_gol4, jarolift, nord_ice, etc.), the 5 Keeloq learning/derivation algorithms, the enlarged encrypted Keeloq keystore, the RX-only->TX upgrades, the region/TX-lock removal, the 3 NFC core protocols (emv, ntag4xx, type_4_tag), the magic ULC key-grab, and 14 transit/payment/lock NFC parsers.
- **Momentum ingests Unleashed via real git merges** -- Unleashed's per-protocol authoring commit SHAs appear in Momentum's history (e.g. jarolift `1d32d1de5`, nord_ice `a5f47e3e6`). This is true ancestry, not manual copying.
- **RogueMaster ingests Unleashed via squashed content-sync** -- the same files are byte-identical (md5) but the original commit SHAs are absent, replaced by dated release snapshots. So RM's copies are real (md5-identical) but lack git ancestry -- a manual/squash-import signature (PROVENANCE.md section 3).
- **RogueMaster <-> Momentum share code both ways:** x10 and the SubGhzProtocolFilter enum are RM/Momentum constructs; hormann_bisecur landed in both via the same upstream PR (user890104). Notably, **RM copied Momentum's SubGhzProtocolFilter enum header WITHOUT the protocol bodies** -- it is vestigial/dead in RM (`types.h:140-157`, no `.c` references it), a clean "header copied without implementation" fingerprint of the Momentum->RM edge.
- **Two files diverge from the shared baseline by local patching:** RM's `ventra.c` (adds a CTA station database), and Momentum's `smartrider.c` (reformat). Everything else in the shared-14 parser set is byte-identical.
- **One genuine reimplementation:** RogueMaster rewrote `beninca_arc` to use the chip's hardware AES (`furi_hal_crypto`) instead of Unleashed/Momentum's software `aes_common.c` helper -- so RM dropped the helper entirely while U/M keep it (sections/subghz-protocols.md section 2b).

---

## (c) What is UNIQUE to each fork (NFC / SubGhz focus)

- **UNLEASHED-unique:** nothing material is *exclusive* to Unleashed among the four for NFC/SubGhz -- it is the **upstream**, so its additions propagate down. Its distinguishing traits are the *largest MFC key dictionary* (4082 keys, ~2x the others) and the most aggressive **region-lock removal** (region HAL gutted to an always-allow stub, region service deleted), versus R/M which keep region but make it user-bypassable.
- **ROGUEMASTER-unique:** `telcoma_edge` SubGhz protocol (RM-original, only fork with it); three NFC parsers `andalucia`, `trea`, `hotels` (the last two undocumented; `hotels` is a parse-only stub); and the **broadest in-tree NFC attack surface** -- it is the only fork vendoring **NFC Fuzzer, Sniffer, Relay (live MITM), and Dict Manager** apps in the firmware tree, plus 665 bundled external apps total (sections/nfc-attacks.md section 4b).
- **MOMENTUM-unique:** core-library integration of the **weather / TPMS / POCSAG protocol pack** (~30 files, with encoders/TX, Load/Save, and a Weather/TPMS filter subsystem) -- RogueMaster ships the same protocols only as separate external apps, and Unleashed fetches them from the catalog; the **ProtoPirate** car/rolling-code SubGhz app (houses the relocated star_line/scher_khan/kia plus aut64/chrysler/ford/honda/... decoders); FSK-12kHz modulation, TX-power setting, and Subdriving GPS-geotagging. Momentum is also the only fork that keeps the OTA region-provisioning service.
- **No fork has a car-key / automotive digital-key NFC parser** -- exhaustively confirmed; all apparent "car key" matches are false positives (transit "Vehicle id", FelicaCardKey, audio assets). The closest added key/lock NFC coverage is **hotel-lock** parsing (saflok in U/R/M; RM's hotels) (sections/nfc-protocols.md section 3).

---

## (d) Changelog-trust results

All three forks' advertised NFC/SubGhz feature sets are **substantially truthful in
code** -- no fabricated or non-functional headline features were found. Trust gaps
are about **attribution, freshness, and omission, not deception**
(sections/changelog-*.md).

- **UNLEASHED:** 18/21 sampled claims fully verified. **Advertised-but-absent-from-firmware-tree:** "Sub-GHz Bruteforce" and "LFRFID/iButton Fuzzer" -- real features, but they live in the separate all-the-plugins pack, not the firmware repo; the feature list reads as if in-firmware. **Stale attribution:** several "Unleashed" NFC parsers (umarsh, troika, social_moscow) and RCA IR are now also in the OFW baseline (partly an artifact of OFW being ~6mo stale). **Undocumented removal:** the 3 RU car-alarm protocols (star_line/kia/scher_khan) are silently dropped with no changelog note.
- **ROGUEMASTER:** 15/16 sampled claims verify present (1 unverifiable -- lives in the encrypted keystore). The in-repo CHANGELOG is *Unleashed's*, presented as RM's, so RM-credited items are mostly inherited. The "ULC Write Support (by @haw8411)" item is actually an inherited **magic-card 3DES-key-grab attack** described more benignly than it is. The one genuinely RM-original SubGhz protocol (`telcoma_edge`) is under-advertised (doc-only), and two RM-unique NFC parsers (`trea`, `hotels`) are undocumented; `hotels` is a dead-on-live-read stub.
- **MOMENTUM:** highest-trust changelog -- 13/15 verified, 0 absent, with consistent `UL:` / `OFW PR ####:` provenance prefixes that accurately attribute inherited work; NFC parser files are byte-identical to Unleashed, matching their `UL:` labels. The main gap is **omission** (the large inherited weather/TPMS/POCSAG protocol pack and several extra gate protocols are not surfaced in the latest changelog window), not fabrication.

**Undocumented additions found in code across forks:** Unleashed's full EMV/ntag4xx/type_4_tag protocol stacks (README mentions only the EMV *parser*); Momentum's weather/TPMS/POCSAG core-lib pack; RM's `telcoma_edge`, `trea`, `hotels`.

---

## (e) Security posture summary

(Full detail in the per-fork audits sections/security-{unleashed,roguemaster,momentum}.md;
see SECURITY.md for the consolidated security write-up. This is a pointer summary,
not a duplication.)

**Crown-jewel question -- does any path emit captured secrets (NFC keys/dumps,
SubGhz rolling codes, dictionary/mfkey results) over radio/BLE/UART/network without
explicit user action? Answer across all three forks: NO.** mfkey/NFC/SubGhz results
stay local on SD; no covert exfiltration, telemetry/phone-home, time-bomb,
obfuscated payload, or auto-emission of captured material was found in any
fork-delta core firmware.

Items with any security weight, all deliberate/overt (not covert):
- **BLE-HID pairing-PIN suppression** (all forks) -- scoped to the user-launched BadKB/BadBT attack tool.
- **Region/TX-lock removal** (all forks) -- a headline feature; TX still requires explicit user action; extended/dangerous ranges ship OFF by default (SD opt-in).
- **Momentum:** an opt-in "RPC-while-locked" toggle (default OFF, F-MOM-SEC-02) and a hardcoded *developer's-own* AlphaVantage API key in a stock-quote app (F-MOM-SEC-01) -- a leak of the dev's credential, not user secrets.
- **RogueMaster:** the broadest attack-app surface (NFC Relay/Sniffer/Fuzzer, WiFi/ESP packs), all overt and user-driven; the only network endpoints are app self-update/store (JBlanked) and host-side AirTag tooling (user's own iCloud) -- no captures exfiltrated.

These are **dual-use security tools standard in the Flipper ecosystem and largely
upstream-derived** -- none is malware. The fork-specific risk delta is **breadth**
(larger dictionaries, more bundled attack apps in RogueMaster), not novel covert
capability.

---

## (f) Sensitive-capability exposure

- **Keeloq keys -- present but ENCRYPTED, not leaked in clear.** All three forks ship a larger manufacturer-key keystore (`keeloq_mfcodes`): **62 records in OFW -> 116 in every fork** (~1.87x, U=R=M byte-identical). Critically, the file is **AES-encrypted at rest** ("Encryption: 1"); the decryption key lives in the device secure enclave and is **not in the repo**, so the repository does **not** expose plaintext Keeloq manufacturer keys. The plaintext user template (`keeloq_mfcodes_user.example`) contains only placeholders (`AABBCCDDEEFFAABB:1:Test1`). The source adds 5 Keeloq **learning/derivation algorithms** (faac/aerf/erreka/pujol/decrypt_derived) that let the firmware derive per-manufacturer keys without precomputed tables (sections/subghz-rollingcode.md section 1.3, section 2). (Note: the plaintext keys are independently known in the community, but that is out of repo scope.)
- **Car-key / rolling-code decoding.** No automotive *digital-key NFC* parser exists in any fork. On the SubGhz side, the forks materially expand rolling-code reach: they convert five previously decode-only garage/gate remotes (faac_slh, somfy_keytis, somfy_telis, nice_flor_s, alutech_at_4n) into **clone/emulate/TX-capable**, add TX-capable jarolift (all) and hormann_bisecur (R/M), and Momentum bundles **ProtoPirate** which decodes a broad set of vehicle/keyfob protocols (aut64, chrysler, ford, honda, mazda, psa, subaru, vag, plus the relocated RU car-alarms). The RU car-alarm protocols (star_line/kia/scher_khan) were *removed* from base firmware in all forks ("bipki removal", legal-distancing) and relocated to an external app in Momentum (sections/subghz-rollingcode.md section 1, sections/changelog-momentum.md section 1).
- **NFC key material.** The forks ship larger plaintext MIFARE Classic key dictionaries (`mf_classic_dict.nfc`: OFW 2042 -> Unleashed 4082, RM=Momentum 2475 identical keys) packed with real-world transit/hotel/access-control keys -- broadening pure-dictionary card opening. They bundle on-device key recovery (mfkey32 + static_nested; no hardnested/darkside) and, in R/M, magic-card writers (Gen1A/B/Gen2/Gen4 GTU incl. UL/NTAG cloning). Momentum/Unleashed/RM all carry the **MfUltralight-C magic-emulation 3DES-key-grab** patch. All of this is dual-use tooling derived from upstream/community code; recovered keys and dumps remain local (sections/nfc-attacks.md sections 1-3).
- **Privacy/intercept (Momentum core-lib).** TPMS decoding (schrader_gg4) extracts stable per-sensor IDs -- a real vehicle re-identification/tracking vector -- and POCSAG decoding reconstructs pager **message content** (hospital/emergency/industrial paging), an intercept-of-content capability illegal in many jurisdictions. Both are **passive receive, user-launched, mainstream community functionality** (rtl_433 / Max-Lapan ports), not covert or Momentum-introduced abuse (sections/subghz-momentum-extras.md section 3).

---

## Confidence & caveats

- High confidence on all lineage edges, md5/file-presence comparisons, protocol/attack enumerations, and the crown-jewel negative (fork-deltas were swept directly).
- The OFW baseline (`c9ab2b68`, ~Dec 2025) is ~6 months stale; "absent in OFW" / "Unleashed-exclusive" statements for a few NFC parsers and the ntag4xx/type_4_tag protocols reflect the pinned snapshot and may understate later upstream absorption. The fork *additions*, *encryptions*, and the car-alarm *removal* findings are robust regardless of baseline age.
- "Suspicious" != "malicious": none of the analyzed firmware is malware. The findings describe expanded dual-use capability and minor accuracy/attribution gaps, not deception or hidden behavior.
