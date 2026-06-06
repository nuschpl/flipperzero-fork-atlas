# CHANGELOG-TRUST Audit — MOMENTUM

Subject: `Next-Flip/Momentum-Firmware` (ex-Xtreme).
Repo HEAD at audit: `8ed809fba` "Fix broken submodule"; `git describe` = `mntm-012-308-g8ed809fba` (so working tree is 308 commits past tag `mntm-012`).
Latest GitHub release: **mntm-012** (release page headline date "December 31"). Web README + releases fetched 2026-06-05.

Sources of advertised claims:
- In-repo `CHANGELOG.md` (the *latest-release delta* only — one release's worth of bullets, not cumulative).
- In-repo `ReadMe.md` lines 93–134 (the cumulative "**our** changes" feature list) + lines 42, 76–83.
- GitHub README (WebFetch) and `releases/latest` (mntm-012) headline bullets.

Method: every claim checked against the **working-tree code** (ground truth). Cross-checked "unique" claims against the other three forks (official `O`, unleashed `U`, roguemaster `R`). Confidence stated where not 1:1.

Repo roots:
`O=flipperdevices/flipperzero-firmware`
`U=DarkFlippers/unleashed-firmware`
`R=RogueMaster/flipperzero-firmware-wPlugins`
`M=Next-Flip/Momentum-Firmware`

---

## 1. Verification table (15 sampled claims, NFC/SubGhz-weighted)

| # | Claim (source) | Verified | Evidence (file:line) | Verdict |
|---|----------------|----------|----------------------|---------|
| 1 | ProtoPirate Sub-GHz external app (CHANGELOG L10; ReadMe via "external") | **yes** | `M/applications/external/proto_pirate/protopirate_app.c`; protocol dir `proto_pirate/protocols/` (aut64, chrysler, fiat, ford, honda, kia_v0..v7, land_rover, mazda, mitsubishi, porsche, psa, subaru, vag, plus moved `star_line.c`, `scher_khan.c`) | Present, works as described |
| 2 | Removed Starline/ScherKhan/Kia from main Sub-GHz app → decode via ProtoPirate (CHANGELOG L135) | **yes** | Not registered in `M/lib/subghz/protocols/protocol_items.c`; no `star_line.c`/`scher_khan.c`/`kia*.c` in `M/lib/subghz/protocols/`; they now live in `M/applications/external/proto_pirate/protocols/` | Accurate (relocated, not deleted) |
| 3 | Disabled X10 + Hörmann BiSecur "due to flash"; "same protocol list as Unleashed" (CHANGELOG L136) | **partial** | `protocol_items.c:72-73` both commented out: `// &subghz_protocol_x10,` / `// &subghz_protocol_hormann_bisecur,`. **But** source files `x10.c`/`.h`, `hormann_bisecur.c`/`.h` still ship in `M/lib/subghz/protocols/` | True at runtime (not registered); files still present (dead). Claim "same list as UL" is approximate — see §3 |
| 4 | Cardin S449 full support, 64-bit Keeloq, FSK12K to read (CHANGELOG L14) | **yes** | Implemented inside Keeloq, not a separate file: `M/lib/subghz/protocols/keeloq.c:195,380,390` (`"Cardin_S449"`); add-manually wired in `subghz_scene_set_type.c` | Present (location differs from naming) |
| 5 | Beninca ARC AES128, 128-bit dynamic (CHANGELOG L15) | **yes** | `M/lib/subghz/protocols/beninca_arc.c:10` includes `aes_common.h`; `:22` `min_count_bit_for_found = 128` | Verified |
| 6 | Jarolift 72-bit dynamic full support (CHANGELOG L16) | **yes** | `M/lib/subghz/protocols/jarolift.c` (+`.h`) present and registered | Verified |
| 7 | Treadmill37 / Ditec GOL4 / KeyFinder / Nord ICE / Allstar Firefly (CHANGELOG L17-21) | **yes** | `M/lib/subghz/protocols/treadmill37.c`, `ditec_gol4.c`, `keyfinder.c`, `nord_ice.c`, `allstar_firefly.c` all present | Verified |
| 8 | New FSK 12 kHz deviation modulation (CHANGELOG L23) | **yes** | preset `subghz_device_cc1101_preset_2fsk_dev12khz_async_regs[]` `M/lib/subghz/devices/cc1101_configs.c:223`; registered as `"FM12K"` in `M/lib/subghz/subghz_setting.c:193` | Verified |
| 9 | TX Power setting (CHANGELOG L31) | **yes** | `M/applications/main/subghz/scenes/subghz_scene_radio_settings.c`; `subghz_last_settings.c/.h` carry the persisted value | Verified |
| 10 | Keeloq "42+ systems" / mntm-012 adds Motorline,Rosh,Pecinin,Rossi,Merlin,Steelmate (CHANGELOG L13; release page) | **yes** | All six names resolve: Rosh/Pecinin/Rossi/Merlin/Steelmate in `M/lib/subghz/protocols/keeloq.c`; Motorline + add-manually entries in `subghz_scene_set_type.c`. 57 distinct `strcmp(instance->manufacture_name...)` branches in `keeloq.c` | Verified (count plausibly ≥42) |
| 11 | New NFC parsers SZPPK, SKPPK, SevPPK + Plantain/TwoCities (CHANGELOG L39) | **yes** | `M/applications/main/nfc/plugins/supported_cards/szppk_so.c`, `sevppk_tk.c`, `sk_tk.c`, `plantain.c`, `two_cities.c`. **md5-identical to Unleashed** → inherited (changelog correctly prefixes "UL:") | Verified; correctly attributed to UL |
| 12 | ISO15693-3 + SLIX write-back; ISO 15693 NFC Writer app (CHANGELOG L9,38) | **yes** | `M/lib/nfc/protocols/slix/slix_poller_i.c` (write path); app `M/applications/external/iso15693_nfc_writer/` | Verified |
| 13 | Mifare Ultralight-C: Write support + ULC Bruteforce/Relay/ULCFkey apps (CHANGELOG L7-9,37) | **yes** | `M/applications/external/ulc_brute/ulc_brute.c` (+`crypto.h`,`ulc_attack.h`), `ulc_relay/ulcrelay.c`, `ulcfkey/ulcfkey.c` | Verified |
| 14 | Indala 224-bit (long) RFID — OFW PR 4343 (CHANGELOG L40) | **yes** | `M/lib/lfrfid/protocols/protocol_indala224.c` registered in `lfrfid_protocols.c` | Verified |
| 15 | Subdriving — save GPS coords for Sub-GHz (ReadMe L107) | **yes** | `M/applications/main/subghz/subghz_history.c:22-23` (`float latitude/longitude`), `:105-114` getters, `:284-285` setters; `helpers/subghz_gps.c`; `scenes/subghz_scene_show_gps.c` | Verified |

Bonus high-level ReadMe claims spot-checked (all **present**): Momentum App `M/applications/main/momentum_app/momentum_app.c`; FindMy `M/applications/system/findmy/findmy.c`; BLE Spam `M/applications/external/ble_spam/`; Wardriver `M/applications/external/wardriver/`; NFC Maker `M/applications/external/nfc_maker/`; Bad-Keyboard (Bad-KB) referenced ReadMe L76-83; CAN Commander `M/applications/external/can_commander/`; Checkers `M/applications/external/checkers/`; Flipper Wedge `M/applications/external/flipper_wedge/`.

**Score: 13 yes / 2 partial / 0 absent.** No advertised-but-absent claims found. No misrepresentations that change capability.

---

## 2. Cross-fork "unique" reality check

The CHANGELOG/ReadMe is mostly honest about provenance — Sub-GHz/NFC protocol bullets are prefixed **"UL:"** (from Unleashed) and OFW PRs are prefixed **"OFW PR ####:"**. Verified:

- **ProtoPirate**: credited to "@RocketGod-git & @xMasterX & @zero-mega et al." with no "UL:" prefix. Cross-check: `proto_pirate` directory is **absent from the current working trees of Unleashed, RogueMaster, AND official** (`find applications* -type d -name proto_pirate` → NONE in O/U/R). So in the *shipped tree* it is effectively a Momentum-bundled external app, not currently an Unleashed app. Attribution to those authors is plausible but "et al." obscures it; not a Momentum-original engine claim, so not flagged as false. Confidence: medium (cross-fork = working-tree snapshot only).
- **ULC apps** (`ulc_brute`, `ulcfkey`, `ulc_relay`): also present in **RogueMaster** (`R` has `ulc_brute` + `ulcfkey`), absent from U/O. So these `@noproto` apps are shared in the RM/M ecosystem, not Momentum-exclusive. Changelog does not claim exclusivity — OK.
- **Sub-GHz protocol count**: O=55, U=62, R=64, **M=94** (`ls lib/subghz/protocols/*.c | wc -l`). Momentum carries the largest set — driven almost entirely by the weather/TPMS/POCSAG pack (see §3), which is NOT what the changelog's headline protocol bullets describe.
- **NFC supported_cards**: M=40, U=40, and the named new parsers are **byte-identical** to Unleashed → correctly credited "UL:". No mis-attribution.

---

## 3. Undocumented notable additions (in code, NOT in CHANGELOG.md)

The CHANGELOG.md is a single-release delta, so much is simply out-of-window. Concrete fork-delta files present in `M/lib/subghz/protocols/` but **absent from Unleashed** and **unmentioned in `CHANGELOG.md`** (grep for acurite/oregon/lacrosse/tpms/pocsag/weather/etc. in CHANGELOG → no protocol hits, only unrelated FlipWeather/FlipLibrary apps):

Weather / sensor / TPMS / pager protocol pack (32 files, M-only vs U):
`acurite_592txr.c, acurite_5n1.c, acurite_606tx.c, acurite_609txc.c, acurite_986.c, ambient_weather.c, auriol_ahfl.c, auriol_hg0601a.c, bresser_3ch.c, emos_e601x.c, gt_wt_02.c, gt_wt_03.c, infactory.c, kedsum_th.c, lacrosse_tx.c, lacrosse_tx141thbv2.c, nexus_th.c, oregon2.c, oregon3.c, oregon_v1.c, solight_te44.c, thermopro_tx4.c, tx_8300.c, vauno_en8822c.c, wendox_w6726.c, ws_generic.c` (weather) + `schrader_gg4.c, tpms_generic.c` (TPMS) + `pocsag.c, pcsg_generic.c` (POCSAG pager) + `x10.c, hormann_bisecur.c` (the two "disabled" ones).

Important runtime nuance (verified, corrects a naive "94 active protocols" read):
- In the **main** SubGhz app these are **commented out** of the registry: `M/lib/subghz/protocols/protocol_items.c:55-73` shows the entire `ws_protocol_*`, `subghz_protocol_pocsag`, `tpms_protocol_schrader_gg4`, `x10`, `hormann_bisecur` block disabled.
- They are instead consumed by **dedicated external apps' own registries**: `M/applications/external/weather_station/protocols/protocol_items.c` (acurite/oregon/etc.), `tpms_reader`, `pocsag_pager`. So the source files in `lib/subghz/protocols` are shared building blocks for those apps.
- This matches the documented "Sub-GHz app is now external on SD card" / RAM-reduction architecture (CHANGELOG L82-87), but the existence of the *weather/TPMS/POCSAG protocol pack itself* is undocumented in the current changelog.

Other undocumented Momentum extras in protocol_items.c (registered, M-only or fork-extra vs U, not in this changelog window): `subghz_protocol_legrand`, `dickert_mahs`, `gangqi`, `marantec24`, `hollarm`, `hay21`, `revers_rb2`, `bin_raw`, `mastercode` (`protocol_items.c:71-80`). These may originate upstream/UL in other windows; flagged as "present, undocumented here," confidence medium pending lineage cross-check.

---

## 4. Flags

- **No advertised-but-absent claims.** Every sampled feature resolves to real code.
- **Present-but-imprecise (minor):**
  - Claim 3 ("Disabled X10/Hörmann BiSecur"): true at the registry level, but the source `.c/.h` still ship as dead files in `lib/subghz/protocols/`. "Same protocol list as Unleashed" is approximate — Momentum still ships 32 weather/TPMS/POCSAG protocol sources Unleashed lacks (they're routed to external apps, not the main app).
  - Claim 4 (Cardin S449): real, but implemented as a Keeloq manufacture-name branch in `keeloq.c`, not a standalone "Cardin" protocol — naming could mislead a reader expecting a dedicated module.
  - ProtoPirate authorship (§2): credited partly to Unleashed devs though the app is not in Unleashed's current tree; "et al." is vague but not a capability misstatement.
- **Honesty positives:** consistent `UL:` / `OFW PR ####:` prefixing accurately attributes inherited Sub-GHz/NFC/RFID work; NFC parser files are byte-identical to Unleashed, matching their "UL:" labels.

Overall: Momentum's changelog is **high-trust** — claims map to code, provenance prefixes are accurate. The main gap is *omission* (large inherited weather/TPMS/POCSAG protocol pack and several extra gate protocols not surfaced in the latest changelog), not *fabrication*.
