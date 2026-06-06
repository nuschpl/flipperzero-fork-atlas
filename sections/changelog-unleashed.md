# CHANGELOG-TRUST Audit — UNLEASHED

Repo: `DarkFlippers/unleashed-firmware` (origin tip; local HEAD `318bfc3b0` "bump apps pack").
Baseline for "vs OFW" deltas: OFFICIAL local HEAD `c9ab2b68` (≈2025-12-01; ~6mo stale vs Unleashed dev — see caveat at end).
Method: STATIC. Advertised claims gathered from the in-repo `ReadMe.md` "What's New" section, in-repo `CHANGELOG.md`, `documentation/SubGHzSupportedSystems.md`, and the GitHub releases page (WebFetch). Every claim verified by reading working-tree code. All paths relative to the unleashed-firmware repo root unless noted.

## 1. Advertised sources

- In-repo `CHANGELOG.md` is **only the latest release's notes** (API 87.8, apps build tag 4jun2026) — it is NOT a cumulative feature list. It even self-documents a regression: "Mifare Mini clones reading is broken (original mini working fine) (OFW)" (`CHANGELOG.md:8`).
- The cumulative feature list lives in `ReadMe.md` "🆕 What's New" (`ReadMe.md:54-141`) and in `documentation/SubGHzSupportedSystems.md`.
- GitHub releases page (WebFetch) gave per-version NFC/SubGHz bullets (unlshd-085…089): Cardin S449, Beninca ARC AES128, Treadmill37, Jarolift, Ditec GOL4, Allstar Firefly, Nord ICE, FAAC SLH fix, ISO15693/SLIX write-back, MfUL-C write, "42+ Keeloq systems".

## 2. Claim verification table

| # | Claim | Source | Verified | Evidence (file:line) | Verdict |
|---|-------|--------|----------|----------------------|---------|
| 1 | FAAC SLH (Spa) manual creation with programming-new-remote (seed) | README L66, L84; rel unlshd-089 | YES | `lib/subghz/protocols/faac_slh.c:24-31` (`faac_prog_mode`, `allow_zero_seed`), `:174-274` programming-mode key gen incl. seed bytes `:223-226`; alloc takes `seed` `:312-321` | True |
| 2 | BFT Mitto (keeloq secure with seed) manual creation; use button 0xF | README L66, L84 | YES | `lib/subghz/protocols/keeloq.c:155-236` — `PROG_MODE_KEELOQ_BFT`, btn `0xF` enters prog mode (`:213-214`), seed transmitted in hop part "like original remote" (`:235-236`) | True |
| 3 | Custom buttons for Keeloq / Alutech AT4N / Nice Flor S / Somfy Telis / Security+2.0 / CAME Atomo (arrow buttons send different button code) | README L82 | YES | Shared block `lib/subghz/blocks/custom_btn.c` + `custom_btn_i.h`/`custom_btn.h`; consumed in `keeloq.c:155` (`subghz_custom_btn_get_prog_mode`), per-protocol .c files present (alutech_at_4n.c, nice_flor_s.c, somfy_telis.c, secplus_v2.c, came_atomo.c all in `lib/subghz/protocols/`) | True |
| 4 | New frequency analyzer; press OK to use detected freq in Read modes; long-press OK to switch to Read menu | README L74-76 | YES | `applications/main/subghz/scenes/subghz_scene_frequency_analyzer.c:56-70` (OkShort saves detected freq to `last_settings->frequency`, disables hopping), `:71-77` (OkLong → `SubGhzSceneReceiver`); view `subghz_frequency_analyzer.c` + worker present | True |
| 5 | Save file with timestamp+protocol name (`Radio Settings → Protocol Names = ON`) | README L77 | YES | `applications/main/subghz/scenes/subghz_scene_radio_settings.c:189-191` ("Protocol Names" VariableItem → `..._set_timestamp_file_names` `:143`) | True |
| 6 | Regional TX restrictions removed | README L62 | YES (reimplemented, not blanket-removed) | OFW uses `furi_hal_region_is_frequency_allowed` (`official .../furi_hal_subghz.c:363`, `lib/subghz/subghz_tx_rx_worker.c:244`). Unleashed **replaces** it with `furi_hal_subghz_is_tx_allowed` (`targets/f7/furi_hal/furi_hal_subghz.c:396`) using fixed widened bands; `lib/subghz/subghz_setting.c:210` "// Region check removed" | True (nuance: region gate replaced by global widened band, not literally "no check") |
| 7 | Extra Sub-GHz frequencies / range extendable in settings (can damage HW) | README L62-63; `documentation/DangerousSettings.md` | YES | `furi_hal_subghz.c:399-402` default bands widened (350MHz / 467.75MHz noted in comments); `:397,405-408` opt-in `dangerous_frequency_i` gate; doc file exists | True |
| 8 | Many rolling-code protocols can save & send captured signals; counter/anti-desync modes | README L64; `SubGHzCounterMode.md` | YES | rolling-counter API `furi_hal_subghz_get/set_rolling_counter_mult` (`furi_hal_subghz.h:179-184`); doc `documentation/SubGHzCounterMode.md` present | True |
| 9 | External CC1101 module support (HW SPI) | README L66, L79-80 | YES | `lib/subghz/devices/` registry + device files present; CC1101 ext device support compiled (devices/registry.c) | True (device subsystem present) |
| 10 | Sub-GHz Remote app (5 files, bind per button) + constructor | README L97-98 | YES | `applications/main/subghz_remote/` (`subghz_remote_app.c`, `_app_i.c/.h`) in-repo | True |
| 11 | Sub-GHz Bruteforce (static-code brute-force plugin) | README L94 | NO (not in firmware repo) | No `applications/external` dir; only IR `lib/infrared/signal/infrared_brute_force.c` exists (unrelated). SubGHz Bruteforce ships via `xMasterX/all-the-plugins`, not this repo | Advertised in README but **absent from firmware tree** — it is an external plugin pack item |
| 12 | EMV protocol + public-data parser (by Leptopt1los & wosk) | README L118; rel unlshd-087 | YES | Parser `applications/main/nfc/plugins/supported_cards/emv.c:3` ("Copyright 2023 Leptoptilos"); full protocol stack `lib/nfc/protocols/emv/`; registered `lib/nfc/protocols/nfc_protocol.h:193` `NfcProtocolEmv` | True |
| 13 | NFC parsers: Umarsh, Zolotaya Korona, Kazan, Metromoney, Moscow Social Card, Troika, "many others" | README L120 | PARTIAL | All present in `applications/main/nfc/plugins/supported_cards/` (umarsh.c, zolotaya_korona.c[/_online.c], kazan.c, metromoney.c, social_moscow.c, troika.c). BUT vs current OFW baseline, umarsh/troika/social_moscow/plantain/mykey are **already in OFW** (upstreamed). Genuinely Unleashed-unique vs OFW: kazan, metromoney, zolotaya_korona(+online), charliecard, csc, saflok, smartrider, ventra, sonicare, sevppk_tk/sk_tk/szppk_so | True the parsers exist; misleading attribution — several are now OFW, not Unleashed-exclusive |
| 14 | NFC `Add manually` → Mifare Classic with custom UID | README L119 | YES | `applications/main/nfc/scenes/nfc_scene_generate_info.c:17,34-37` builds MfClassic/MfUltralight with editable UID; generate-scene flow present | True |
| 15 | Add DEZ 8 display form for EM4100 | README L116 | YES | `lib/lfrfid/protocols/protocol_em4100.c:377` `"DEZ 8: %08lu\n"` | True |
| 16 | Infrared → RCA protocol | README L107 | YES (but now also OFW) | `lib/infrared/encoder_decoder/rca/infrared_protocol_rca.c:26 .name="RCA"`. Note: RCA **also present in OFW baseline** (`official .../encoder_decoder/rca/`) — no longer Unleashed-exclusive | True |
| 17 | BadKB / BadUSB-over-Bluetooth (integrated into BadUSB app) | README L134 | YES | `applications/main/bad_usb/helpers/ble_hid_ext_profile.c/.h`; scenes `bad_usb_scene_config_ble_name.c`, `bad_usb_scene_config_ble_mac.c`; integrated in `bad_usb_app.c` | True |
| 18 | BadUSB keyboard layouts | README L135 | YES | `applications/main/bad_usb/scenes/bad_usb_scene_config_layout.c`; assets `applications/main/bad_usb/resources/badusb/assets/layouts` | True |
| 19 | LFRFID and iButton Fuzzer plugins | README L115 | NO (not in firmware repo) | No fuzzer app/source in tree; only leftover icon resources `applications/main/clock_app/resources/{ibtnfuzzer,rfidfuzzer}`. The Fuzzer apps ship via all-the-plugins | Advertised in NFC/RFID section but **absent from firmware tree** — external plugins |
| 20 | New protocols: Allstar Firefly, Nord ICE, Ditec GOL4, Beninca ARC, Treadmill37, Jarolift | README L143-151; releases 085-087 | YES | All present + registered in `lib/subghz/protocols/protocol_items.c:29-32` (treadmill37, beninca_arc, jarolift, ditec_gol4, nord_ice, allstar_firefly) and as `.c/.h` pairs | True |
| 21 | Cardin S449 full support (64-bit keeloq) | release unlshd-085 | YES | Handled inside keeloq: `grep "Cardin" lib/subghz/protocols/keeloq.c` matches (Cardin is a keeloq manufacturer variant, not a standalone file) | True |

## 3. Undocumented notable additions (in code, NOT in README "What's New")

SubGHz protocols present + registered in `lib/subghz/protocols/protocol_items.c` and unique vs OFW baseline, but absent from the README highlight list (they ARE listed in `documentation/SubGHzSupportedSystems.md`, just not the README "What's New"):

| File | Registered | In SupportedSystems.md | In README "What's New" |
|------|-----------|------------------------|------------------------|
| `lib/subghz/protocols/honeywell.c` | yes (`protocol_items.c:24`) | yes (L71-72) | no (only "Honeywell Sec/WDB" appear under *Ignore* options, L87) |
| `lib/subghz/protocols/honeywell_wdb` (phoenix_v2 line) | yes (`protocol_items.c:17`) | yes | no |
| `lib/subghz/protocols/keyfinder.c` | yes (`protocol_items.c:31`) | yes (L88) | no |
| `lib/subghz/protocols/elplast.c` | yes (`protocol_items.c:29`) | yes (L36) | no |
| `lib/subghz/protocols/aes_common.c` | helper (used by beninca_arc AES128) | n/a | no |

NFC library-level additions vs OFW (only the EMV *parser* is mentioned in README; the full protocol stack is undocumented):
- `lib/nfc/protocols/emv/` — full EMV poller/protocol (README mentions parser only).
- `lib/nfc/protocols/ntag4xx/` — undocumented.
- `lib/nfc/protocols/type_4_tag/` — undocumented.

## 4. Flags: advertised-but-absent / present-but-misrepresented / undocumented removals

ADVERTISED-BUT-ABSENT (from the firmware repo — they are real, but live in the separate `xMasterX/all-the-plugins` pack, which the README does cross-link; the framing in the feature list reads as if in-firmware):
- **Sub-GHz Bruteforce** (README L94) — no source in tree. Confidence: high.
- **LFRFID / iButton Fuzzer** (README L115) — no source in tree (only stale icon resources under clock_app). Confidence: high.

PRESENT-BUT-MISREPRESENTED / STALE ATTRIBUTION (low-severity, accuracy issues — feature works, but the "unique to Unleashed / by Unleashed team" implication is outdated because OFW has since absorbed them; this is partly an artifact of the OFW baseline being ~6mo stale — see caveat):
- **NFC parsers** (claim #13): umarsh, troika, social_moscow, plantain, mykey are present in BOTH Unleashed and the OFW baseline. README lists them as Unleashed parsers "(by @Leptopt1los and @assasinfil)". Authorship may be correct historically, but they are no longer Unleashed-exclusive.
- **RCA IR** (claim #16): also in OFW baseline; not Unleashed-exclusive.

UNDOCUMENTED REMOVALS (regression-style; not mentioned anywhere in README/CHANGELOG):
- **Car-alarm SubGHz protocols removed**: OFW registers `star_line`, `kia`, `scher_khan` in `official .../protocols/protocol_items.c:6,15,20` and ships `kia.c/scher_khan.c/star_line.c`. Unleashed has **none of these** — absent from `protocols/` dir and from `protocol_items.c`. Net: Unleashed adds ~10 protocols but silently drops 3 OFW ones. Confidence: high.
- **Self-admitted regression** (to Unleashed's credit, this one IS documented): Mifare Mini clone reading broken (`CHANGELOG.md:8`).

## 5. Overall verdict

Unleashed's advertised feature set is **largely truthful and verifiable in code**. Of 21 sampled claims: 18 fully verified, 1 partial (NFC parser attribution), 2 absent-from-firmware (Bruteforce, Fuzzer — but these are honestly described elsewhere as community/all-the-plugins items). No evidence of fabricated or non-functional headline features. The SubGHz manual-creation / programming-mode / seed claims (FAAC SLH, BFT Mitto) — the most security-relevant — are real and substantively implemented.

Main trust gaps are **accuracy/freshness**, not deception: (a) two "feature list" items only exist in the plugin pack, (b) several "Unleashed" parsers/protocols are now upstream in OFW, and (c) three OFW car-alarm protocols are silently removed with no changelog note.

### Caveat
The OFW baseline used (`c9ab2b68`, ≈Dec 2025) is ~6 months older than Unleashed dev. "Already in OFW" / "no longer Unleashed-exclusive" statements (claims #13, #16) reflect that this OFW snapshot already contains those features; they may have originated in Unleashed and been upstreamed. The car-alarm *removal* finding is robust regardless of baseline age (those files exist in OFW and are simply gone in Unleashed).
