# Flipper FW Feature Tree — Completeness Matrix

> **GENERATED from `data/features.json` + `data/structure.json` — do not hand-edit. Run `node build.mjs`.**
> Legend: ✓ present · ✗ absent · ~ partial/variant · *value* = literal. Columns **O**/**U**/**R**/**M** = Official / Unleashed / RogueMaster / Momentum.

| Code | Fork | Repo | Role |
|---|---|---|---|
| O | Official | flipperdevices | Upstream baseline |
| U | Unleashed | DarkFlippers | 1st-order fork · source of most additions |
| R | RogueMaster | RogueMaster | Unleashed + huge bundled app pack |
| M | Momentum | Next-Flip | Unleashed fork (ex-Xtreme) |


## 1. SubGhz

### 1.1 Protocol coverage — lib/subghz/protocols

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Official base protocols `52 shared core` | protocol | The 52 upstream SubGhz protocol decoders/encoders (CAME, Nice, Princeton, Holtek…) inherited unchanged by every fork. | ✓ | ✓ | ✓ | ✓ | Upstream OFW. Byte-identical core shared by all four. |
| aes_common `helper` | protocol | Software AES-128 helper that AES-based remotes (e.g. Beninca ARC) call for decryption. | ✗ | ✓ | ✗ | ✓ | U-origin (`db2dc8f64`, landed with beninca_arc). **R dropped it** — RogueMaster switched Beninca to the chip's hardware AES, so the SW helper is absent there. |
| allstar_firefly | protocol | AllStar Firefly garage / gate remote, decode + encode capable. | ✗ | ✓ | ✓ | ✓ | U-origin (`1f2022b87`, jlaughter). Propagated U→M by real merge (shared SHAs); U→R by squashed bulk import. |
| beninca_arc | protocol | Beninca ARC AES rolling-code gate remote; implementation splits 3-ways across forks. | ✗ | ✓ | ✓ | ✓ | U-origin (`db2dc8f64`, MX). **3-way md5 divergence**: U & M use software `aes_common`; R re-implemented it on hardware AES via `furi_hal_crypto` (`a2cf8be10`). |
| ditec_gol4 | protocol | DITEC GOL4 gate / barrier remote protocol. | ✗ | ✓ | ✓ | ✓ | U-origin (`556a2dd3f`, MX). |
| elplast | protocol | Elplast gate remote protocol. | ✗ | ✓ | ✓ | ✓ | U-origin. |
| honeywell | protocol | Honeywell wireless alarm door / window sensor decoder. | ✗ | ✓ | ✓ | ✓ | U-origin. |
| jarolift | protocol | Jarolift roller-shutter remote — Keeloq-family rolling code, transmit-capable. | ✗ | ✓ | ✓ | ✓ | U-origin (`271c65a96`, MX). Consumes the Keeloq learning algorithms; full clone/TX. |
| keyfinder | protocol | Key-finder beeper-tag protocol for locating lost tags. | ✗ | ✓ | ✓ | ✓ | U-origin (`d18619ff5`, MX); U=R=M byte-identical. |
| nord_ice | protocol | Nord / ICE remote protocol decoder. | ✗ | ✓ | ✓ | ✓ | U-origin (`a5f47e3e6`, MX). |
| treadmill37 | protocol | Treadmill remote-control protocol. | ✗ | ✓ | ✓ | ✓ | U-origin. |
| hormann_bisecur | protocol | Hörmann BiSecur AES garage-door remote, transmit-capable. | ✗ | ✗ | ✓ | ✓ | **R/M only** — the same upstream PR (user890104) landed in both; never in Unleashed. Momentum disables it in the registry (compiled but flash-gated). |
| telcoma_edge | protocol | Telcoma Edge gate remote — RogueMaster's only original SubGhz protocol. | ✗ | ✗ | ✓ | ✗ | **RogueMaster-exclusive & RM-original** (`529fdbad3`, Benjamin Tamasi). The only ground-up protocol authored in a fork rather than inherited. |
| x10 | protocol | X10 RF home-automation protocol, decode-only. | ✗ | ✗ | ✓ | ✓ | **R-origin** (`889674048`, RogueMaster) → propagated to Momentum. Decode-only. M disables it in the registry. |
| Weather-station pack `~24 files` | protocol | rtl_433-derived weather sensor decoders (Acurite, Oregon, LaCrosse, Auriol, Bresser…). | ✗ | ✗ | app | ✓ | **Momentum-only in the core lib**; ported from rtl_433 via the weather_station app (HTotoo `b9382c912`). RogueMaster ships the same set only as external FAP apps. Commented out of M's main registry → served by external apps. |
| TPMS pack `schrader_gg4, tpms_generic` | protocol | Car tire-pressure sensor decoders; expose stable per-vehicle IDs (tracking vector). | ✗ | ✗ | app | ✓ | M-only core-lib (rtl_433 port, HTotoo). Passive RX. RogueMaster bundles the same as an external app. |
| POCSAG / pager pack `pocsag, pcsg_generic` | protocol | POCSAG pager decoder that reconstructs pager message text content (intercept). | ✗ | ✗ | app | ✓ | M-only core-lib (Max Lapan `4c092c8e6`). RogueMaster bundles it as an external app. |
| tx_8300 | protocol | TX-8300 thermo / hygro weather sensor decoder. | ✗ | ✗ | ✗ | ✓ | Momentum-only (core-lib). |
| star_line / kia / scher_khan `REMOVED` | protocol | Russian car-alarm decoders — present upstream, deleted from all three forks. | ✓ | ✗ | ✗ | ✗ | **Deleted in all forks** via Unleashed `50b5ee103` "bipki removal" (MX, 2026-01-12) — "they are in other app". Were decode-only. Relocated to an external app (Momentum: ProtoPirate). A rare case of forks *removing* upstream capability. |

### 1.2 Rolling-code & security-sensitive remotes

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Keeloq decode | protocol | Decodes Keeloq hopping-code remotes used by gates, cars and alarms. | ✓ | ✓ | ✓ | ✓ | Upstream. |
| Keeloq learning / derivation algos | capability | Five algorithms (Faac, AERF, Erreka, Pujol, decrypt-derived) to derive manufacturer keys and clone remotes. | ✗ | ✓ | ✓ | ✓ | U-origin; `keeloq_common.c` is **md5-identical** across U/R/M (`c87b1211…`). The file grew 127→236 lines; `learning_pujol` added in U `63d49b6e4` (MX, 2026-04-21). Each `type` selects a derivation that turns a 64-bit manufacturer key + serial (+seed) into the per-remote device key. **Full chain + GitHub permalinks in CRYPTO-CHAIN.md.** |
| Keeloq manufacturer keystore `keeloq_mfcodes` | capability | AES-encrypted manufacturer-key store; forks roughly double the record count. | 62 | 116 | 116 | 116 | Forks ship a larger keystore — **62 → 116 records** (U=R=M byte-identical, `c4d8342f…`). The file is **AES-encrypted at rest** (`Encryption: 1`). The AES key is **slot 1** of the STM32WB55 **secure enclave** (CKS, managed by FUS on the M0+ radio core) — **factory-provisioned**, never in the repo, and **not software-readable** (no key read-back command). Firmware loads it into the `AES1` hardware and decrypts on-device (`subghz_keystore.c:119/145`); the IV comes from the file header. So the repo exposes **no plaintext keys**; `*_user.example` holds only `AABBCCDDEEFFAABB` placeholders. Full mechanism + on-device-oracle caveat in SECURITY.md → 'Secure enclave (CKS)'. |
| Keeloq emulate / clone / TX | capability | Transmit and replay captured Keeloq codes; forks add a Save flag. | ✓ | ✓ | ✓ | ✓ | Send flag upstream; forks add Save flag. |
| Jarolift clone+TX | protocol | Jarolift rolling-code clone and transmit, using Keeloq derivation. | ✗ | ✓ | ✓ | ✓ | U-origin; full TX; consumes the Keeloq learning algos. |
| Hörmann BiSecur clone+TX | protocol | BiSecur AES garage remote clone + transmit (Momentum ships it disabled). | ✗ | ✗ | ✓ | ✓ | R/M only; full TX. Momentum registry-disables it. |
| Somfy / Nice / FAAC / Alutech: RX → TX | protocol | Five decode-only garage/gate remotes upgraded to clone & transmit in the forks. | RX-only | +TX | +TX | +TX | Forks add `SubGhzProtocolFlag_Send` to faac_slh, somfy_keytis, somfy_telis, nice_flor_s and alutech_at_4n — turning five **decode-only** remotes into clone/emulate/TX-capable. |
| Security+ v1/v2 TX | protocol | Chamberlain Security+ garage rolling-code transmit; forks add Save. | ✓ | ✓ | ✓ | ✓ | Upstream TX; +Save flag in forks. |

### 1.3 TX power & region restrictions

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Mandatory region TX gate `furi_hal_region` | capability | Geographic frequency lock that enforces legal transmit bands. | enforced | removed | bypassable | bypassable | **Unleashed guts it** to an always-allow stub. R/M keep the region service but add a user toggle `bypass_region` (default OFF). |
| Extended frequency range | capability | Widens TX/RX to the full CC1101 'YARD Stick' bands (281–361 / 378–481 / 749–962 MHz). | ✗ | ✓ | ✓ | ✓ | All forks widen `is_frequency_valid`; opt-in toggle, default OFF via SD asset. |
| OTA region-provisioning service `region.c` | capability | Service that provisions the region profile over-the-air at activation. | ✓ | ✗ | ✗ | ✓ | U & R **delete** the region service; **Momentum keeps it** — the one fork retaining OTA region provisioning. |
| Unlock asset (SD, default OFF) | capability | SD-card file the user must add to enable the extended/dangerous range. | ✗ | dangerous_settings | extend_range | extend_range | All ship OFF; opt-in via SD card. U uses `dangerous_settings`; R/M use `extend_range.txt` (M generates it at runtime). |
| RX protocol-filter bypass `ignore_filter` | capability | Receives and decodes protocols that are otherwise blocked or disabled. | ✗ | ✓ | ✓ | ✓ | RX-only `ignore_filter` added in all three forks; absent upstream. |
| External CC1101 extended range | capability | Extended-range logic mirrored for an external CC1101 radio module. | ~ | ✓ | ✓ | ✓ | Forks mirror the extended-range logic for the external radio path. |

### 1.4 SubGhz tooling

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Bruteforce / BinRAW | capability | Brute-force gate codes and raw-bit replay tooling. | ~ | ~ | ✓ | ~ | The SubGHz Bruteforce app is not in the U firmware tree (lives in all-the-plugins); `bin_raw.c` is in the fork core libs. |
| Frequency analyzer hotkeys | capability | Detect a signal's frequency, then one-press jump straight to it. | ~ | ✓ | ✓ | ✓ | U adds OK-short → use-freq / OK-long → Read menu (`subghz_scene_frequency_analyzer.c:56-77`). |
| FSK 12 kHz modulation (FM12K) | capability | 12 kHz FSK deviation preset needed by certain remotes. | ✗ | ✗ | ~ | ✓ | M-added preset (`cc1101_configs.c:223`). |
| Subdriving (GPS geotag) `subghz_gps` | capability | Geotag captured signals via a UART GPS module (war-driving). | ✗ | ✗ | ✓ | ✓ | RX-only UART NMEA; geotag stored locally. R `subghz_gps.c`, M `subghz_history.c:22-23`. |
| TX power setting | capability | Persisted, adjustable transmit power level. | ✗ | ~ | ~ | ✓ | Momentum adds persisted TX power (`subghz_scene_radio_settings.c`). |
| Custom buttons `custom_btn.c` | capability | Map the arrow keys to alternate remote button codes during replay. | ✗ | ✓ | ✓ | ✓ | U-origin `lib/subghz/blocks/custom_btn.c`; supports Keeloq/Alutech/Nice/Somfy/Secplus2/CAME Atomo. |
| Timestamped save filename | capability | Auto-names saved captures by timestamp + protocol. | ✗ | ✓ | ✓ | ✓ | U `subghz_scene_radio_settings.c:189-191`. |

## 2. NFC

### 2.1 Protocol coverage — lib/nfc/protocols

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Official base set `12 protocols` | product | Twelve upstream NFC stacks (MIFARE Classic/DESFire/Plus/Ultralight, ISO14443 a/b 3/4, ISO15693, FeliCa, SLIX, ST25TB). | ✓ | ✓ | ✓ | ✓ | Upstream; byte-identical base. |
| emv | product | Reads EMV bank cards — AIP parse, SFI brute-force, PAN & cardholder extraction. | ✗ | ✓ | ✓ | ✓ | U-origin, built incrementally (AIP, SFI brute, PAN/cardholder). R/M inherit byte-identical. |
| ntag4xx | product | NTAG 4xx (ISO type-4) tag protocol support. | ✗ | ✓ | ✓ | ✓ | U-origin (`fa6839d28` "nfc lib"); R/M byte-identical. |
| type_4_tag | product | ISO type-4 tag read plus a card-emulation listener. | ✗ | ✓ | ✓ | ✓ | U-origin (`fa6839d28`); R/M byte-identical. |
| MfUltralight-C 3DES key-page write | product | Permits writing the Ultralight-C 3DES key page — the 'magic emulation key-grab'. | ✗ | ✓ | ✓ | ✓ | U-origin; `mf_ultralight_listener.c:204-218` — "MAGIC: allow write to ULC key page". U=R=M md5 `9fbc7f41…`, differs from O. |

### 2.2 Key recovery & attacks

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Mfkey32 nonce capture `Detect Reader` | attack | Logs reader nonces ('Detect Reader') for offline MIFARE key cracking. | ✓ | ✓ | ✓ | ✓ | Upstream OFW (`mfkey32_logger.c`). |
| On-device mfkey app (in tree) | attack | On-device MIFARE Classic key-recovery app vendored in the firmware tree. | ✗ | ✓ | ✓ | ✓ | noproto/FlipperMfkey. Official ships it via App Hub (not in tree). U has it as a system app; R/M external. U=R `mfkey.c` md5-identical; crypto1 core byte-identical across all three. |
| Mfkey attack coverage | attack | Which key-recovery attacks the on-device app implements. | ✗ | mfkey32+nested | mfkey32+nested | mfkey32+nested | mfkey32 + static-nested only. No hardnested / darkside (those stay PC-class). |
| MIFARE Classic key dictionary `mf_classic_dict.nfc` | attack | Plaintext dictionary of MIFARE keys for dictionary attacks; sizes diverge sharply. | 2042 | 4082 | 2475 | 2475 | Plaintext key list. **Unleashed is ~2× the rest (4082 keys)**. R == M are **byte-identical key sets** (2475, same order; only comment case differs) — a shared-origin signal. |
| Ultralight-C key dictionary `mf_ultralight_c_dict.nfc` | attack | 3DES key dictionary for Ultralight-C; forks add two keys. | 48 | 50 | 50 | 50 | Forks +2 keys; minor. |
| Magic-card writing (nfc_magic) | attack | Write/clone to magic cards; only RogueMaster and Momentum vendor the app. | ✗ | ✗ | ✓ | ✓ | R/M vendor the full app; `gen4_poller.c` byte-identical R=M (`0d77609f…`). O ships via App Hub; U doesn't vendor it. |
| Magic types supported | attack | Magic-card generations the writer covers. | ✗ | ✗ | Gen1A/2/4 | Gen1A/2/4 | Gen1A/B, Gen2, Gen4 GTU (incl. Ultralight/NTAG cloning via Gen4). Shared upstream nfc_magic. |

### 2.3 Parsers — transit, payment, locks, cars

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Shared +14 transit/payment/lock parsers | parser | Fourteen card parsers (Charliecard, Metromoney, Saflok, Ventra, Zolotaya Korona…) added by Unleashed. | ✗ | ✓ | ✓ | ✓ | U-origin; 12 of 14 byte-identical across U/R/M. |
| smartrider.c variant | parser | SmartRider (Perth) transit parser — Momentum carries a reformatted variant. | ✗ | ✓ | ✓ | ~ | M reformat/edit; M md5 differs from U=R. |
| ventra.c variant | parser | Ventra (Chicago) transit parser; RogueMaster adds a CTA station database. | ✗ | ✓ | ~ | ✓ | R adds a CTA station DB ("FatherDivine"); R md5 differs from U=M. |
| andalucia | parser | Consorcio Andalucía (Spain) transit-card parser; hardcoded key, sector 9. | ✗ | ✗ | ✓ | ✗ | **RogueMaster-only.** |
| trea | parser | TREA (Italy) transit-card parser — RM-only and undocumented. | ✗ | ✗ | ✓ | ✗ | **RogueMaster-only**, undocumented (`0252da598`). |
| hotels | parser | Saflok / VingCard / Onity hotel-lock parser; parse-only stub, dead on live read. | ✗ | ✗ | ✓ | ✗ | **RogueMaster-only**, undocumented; verify/read are stubs (parse-only, dead on live read). |
| Hotel-lock parsing (saflok) | parser | Saflok hotel-door MIFARE lock parser — the closest 'key/lock' addition. | ✗ | ✓ | ✓ | ✓ | Hotel-door MFC, not automotive. |
| Automotive digital-key NFC parser `NONE` | parser | No car digital-key NFC parser exists in any fork — exhaustively confirmed. | ✗ | ✗ | ✗ | ✗ | **None in any fork.** Every apparent "car key" match was a false positive — transit "Vehicle id", FeliCa `FelicaCardKey`, wav audio assets, unit-test fixtures. |

## 3. Stack & primitives

### 3.1 Modulations

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| OOK / ASK | modulation | On-off / amplitude-shift keying — most garage, gate and alarm remotes. | ✓ | ✓ | ✓ | ✓ | Core CC1101 modulation; presets Ook270Async / Ook650Async. |
| 2-FSK | modulation | Two-level frequency-shift keying — weather, TPMS, pagers, BiSecur. | ✓ | ✓ | ✓ | ✓ | Presets 2FSKDev238Async / 2FSKDev476Async. |
| GFSK | modulation | Gaussian FSK — higher-rate links (e.g. esubghz chat, some sensors). | ✓ | ✓ | ✓ | ✓ | CC1101 GFSK presets. |
| MSK | modulation | Minimum-shift keying — niche high-rate CC1101 mode. | ✓ | ✓ | ✓ | ✓ | CC1101 MSK preset. |
| Load modulation (13.56) | modulation | Passive card→reader load modulation on the NFC 847 kHz subcarrier. | ✓ | ✓ | ✓ | ✓ | ISO14443 physical layer (ST25R frontend). |

### 3.2 Line encodings

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| PWM / RAW timing | encoding | Pulse-width / raw bit-timing decode used by most OOK remotes & Keeloq. | ✓ | ✓ | ✓ | ✓ | lib/subghz/blocks/decoder, generic_x_to_normalize. |
| Princeton (te) | encoding | Fixed short/long-pulse 'te' timing — Princeton/CAME/Nice fixed-code remotes. | ✓ | ✓ | ✓ | ✓ | princeton.c and friends. |
| Manchester (SubGhz) | encoding | Manchester / bi-phase line coding for weather & sensor protocols. | ✓ | ✓ | ✓ | ✓ | Manchester decoder block. |
| Modified Miller | encoding | Reader→card coding for ISO14443-A at 106 kbps. | ✓ | ✓ | ✓ | ✓ | ISO14443-3A PHY. |
| Manchester (card→reader) | encoding | Card→reader subcarrier coding for ISO14443-A / FeliCa. | ✓ | ✓ | ✓ | ✓ | ISO14443-3A / FeliCa PHY. |
| PPM 1-of-4 / 1-of-256 | encoding | Pulse-position coding used by ISO15693 vicinity tags. | ✓ | ✓ | ✓ | ✓ | ISO15693-3 PHY. |

### 3.3 CC1101 presets

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| AM270 | preset | OOK preset, ~270 kHz bandwidth — narrow fixed-code remotes. | ✓ | ✓ | ✓ | ✓ | FuriHalSubGhzPresetOok270Async. |
| AM650 | preset | OOK preset, ~650 kHz bandwidth — most rolling-code remotes/Keeloq. | ✓ | ✓ | ✓ | ✓ | FuriHalSubGhzPresetOok650Async. |
| FM238 | preset | 2-FSK preset, 2.38 kHz deviation — many sensors. | ✓ | ✓ | ✓ | ✓ | FuriHalSubGhzPreset2FSKDev238Async. |
| FM476 | preset | 2-FSK preset, 4.76 kHz deviation — wider FSK links. | ✓ | ✓ | ✓ | ✓ | FuriHalSubGhzPreset2FSKDev476Async. |
| FM12K (custom) | preset | Custom 12 kHz FSK deviation preset — Momentum-added. | ✗ | ✗ | ~ | ✓ | Momentum cc1101_configs.c:223; see to-fm12k. |

### 3.4 Ciphers & rolling-code

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Keeloq NLF | cipher | 32-bit non-linear-feedback block cipher, 64-bit key — hopping-code remotes. | ✓ | ✓ | ✓ | ✓ | lib/subghz/protocols/keeloq_common.c — `KEELOQ_NLF`, encrypt/decrypt. **The shared cryptographic root of the whole Keeloq family** (decode, emulate/TX, the learning algos, Jarolift all funnel through it). Full layered chain (radio → enclave → keystore → learning → this cipher) in **CRYPTO-CHAIN.md**. |
| Crypto1 | cipher | 48-bit stream cipher of MIFARE Classic — broken (mfkey/nested). | ✓ | ✓ | ✓ | ✓ | lib/nfc/helpers/crypto1.c. |
| AES-128 | cipher | Block cipher behind Hörmann BiSecur and Beninca ARC remotes; DESFire. | ✓ | ✓ | ✓ | ✓ | furi_hal_crypto (HW AES) + software aes_common in U/M. |
| 3DES / DES | cipher | Triple-DES for MIFARE Ultralight-C auth and DESFire/EMV. | ✓ | ✓ | ✓ | ✓ | mf_ultralight / mf_desfire crypto. |

### 3.5 NFC RF layers

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| ISO14443-A | layer | 13.56 MHz type-A: Miller in, Manchester out, anticollision (MIFARE/NTAG). | ✓ | ✓ | ✓ | ✓ | lib/nfc/protocols/iso14443_3a. |
| ISO14443-B | layer | 13.56 MHz type-B physical/anticollision layer. | ✓ | ✓ | ✓ | ✓ | lib/nfc/protocols/iso14443_3b. |
| ISO14443-4 (APDU) | layer | Block transport for APDU exchange — EMV, DESFire, type-4 tags. | ✓ | ✓ | ✓ | ✓ | lib/nfc/protocols/iso14443_4a/4b. |
| ISO15693 | layer | Vicinity tags (SLIX) — 1-of-256 PPM coding, longer range. | ✓ | ✓ | ✓ | ✓ | lib/nfc/protocols/iso15693_3. |
| FeliCa | layer | 212/424 kbps Manchester NFC-F (transit cards in JP/HK). | ✓ | ✓ | ✓ | ✓ | lib/nfc/protocols/felica. |

### 3.6 Radios

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| CC1101 (sub-GHz) | radio | Sub-GHz transceiver; internal chip + optional external module. | ✓ | ✓ | ✓ | ✓ | targets/f7/furi_hal/furi_hal_subghz.c + cc1101_ext. |
| ST25R3916 (13.56) | radio | NFC analog frontend driving all 13.56 MHz RF layers. | ✓ | ✓ | ✓ | ✓ | lib/nfc + furi_hal_nfc. |

## 4. Apps & plugins

### 4.1 NFC / SubGhz relevant apps

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| External apps vendored in tree | app | Count of external .fap apps shipped inside the firmware git tree. | 0 | 0 | 665 | ~245 | O/U distribute via catalogs (App Hub / all-the-plugins); **RogueMaster ships the largest in-tree pack (665)**. |
| nfc_magic | fap | Magic-card writer app — RogueMaster and Momentum vendor it. | ✗ | ✗ | ✓ | ✓ | R/M vendor; shared upstream. |
| mfkey | fap | MIFARE key-recovery app (shared noproto upstream). | ✗ | ✓ | ✓ | ✓ | U as system app; R/M external. |
| NFC Fuzzer / Sniffer / Relay / Dict Mgr | fap | RogueMaster-only NFC attack suite, including a live relay (MITM). | ✗ | ✗ | ✓ | ✗ | **RogueMaster-only** in-tree; broadest NFC attack surface (Relay = live man-in-the-middle). |
| ProtoPirate | fap | Momentum car / rolling-code SubGhz app (AUT64, Chrysler, Ford, Honda… + relocated RU car alarms). | ✗ | ✗ | ✗ | ✓ | **Momentum-bundled** external app; houses the relocated star_line/scher_khan/kia plus aut64/chrysler/ford/honda/… decoders. Not in U/R/O current trees. |
| ULC apps (brute / fkey / relay) | fap | Ultralight-C brute-force, key and relay tools. | ✗ | ✗ | ~ | ✓ | Shared @noproto; RogueMaster has a subset (brute + fkey), Momentum has all three. |
| weather_station / tpms / pocsag apps | fap | External sensor & pager apps (RogueMaster + Momentum bundle them). | ✗ | ✗ | ✓ | ✓ | Community apps; Momentum also integrates them into the core lib. |

## 5. Apps & FAPs

### 5.1 Verified bundled FAPs (NFC/SubGhz)

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| nfc_magic | fap | Magic-card writer (Gen1A/B, Gen2, Gen4 GTU) for UID/cloning. | ✗ | ✗ | ✓ | ✓ | Bundled in-tree by R/M; gen4_poller.c byte-identical R=M. |
| mfkey | fap | On-device MIFARE Classic key recovery (mfkey32 + static-nested). | ✗ | ✗ | ✓ | ✓ | noproto/FlipperMfkey; U ships it as a system app instead. |
| nfc_fuzzer | fap | Brute/fuzz NFC UIDs against readers. | ✗ | ✗ | ✓ | ✗ | RogueMaster-only in tree. |
| mifare_fuzzer | fap | Emulate-and-cycle MIFARE UIDs to fuzz access readers. | ✗ | ✗ | ✓ | ✓ | Community app bundled by R/M. |
| nfc_dicts_manager | fap | Manage / edit the MIFARE key dictionaries on SD. | ✗ | ✗ | ✓ | ✗ | RogueMaster-only in tree. |
| iso15693_nfc_writer | fap | Write/clone ISO15693 vicinity tags. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M. |
| uhf_rfid | fap | UHF (860–960 MHz) RFID reader via add-on module. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M; separate UHF band. |
| subghz_bruteforcer | fap | Brute-force fixed-code gates by replaying the full code space. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M; not in U firmware tree. |
| sub_analyzer | fap | Inspect/decode .sub captures and signal parameters. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M. |
| esubghz_chat | fap | Encrypted sub-GHz text chat over CC1101. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M. |
| tpms_reader | fap | Read car tire-pressure sensors (Schrader etc.). | ✗ | ✗ | ✗ | ✓ | Momentum-only as this app name; R uses core-lib/other app. |
| weather_station | fap | Receive rtl_433 weather-station sensors. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M; M also integrates into core lib. |
| pocsag_pager | fap | Decode POCSAG pager message text content. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M. |
| gps_nmea | fap | UART GPS readout; feeds geotagging / subdriving. | ✗ | ✗ | ✓ | ✓ | Bundled by R/M. |
| ulc_relay | fap | Ultralight-C relay tool. | ✗ | ✗ | ✓ | ✓ | @noproto; R/M. |
| ble_spam | fap | Spam BLE advertising packets (Apple/Android pairing popups). | ✗ | ✗ | ✓ | ✓ | Bundled by R/M; user-launched. |
| ghost_esp | fap | Front-end for ESP32 WiFi attack/recon firmware over UART. | ✗ | ✗ | ✓ | ✓ | Companion ESP32 app; host-side, user-launched. |

## 6. Security posture

### 6.1 Crown-jewel & covert-behavior checks

| Feature | Type | Implements | O | U | R | M | Provenance |
|---|---|---|:--:|:--:|:--:|:--:|---|
| Telemetry / phone-home | security | Any analytics or beacon in the core firmware. None found — clean across all forks. | ✗ | ✗ | ✗ | ✗ | No telemetry/phone-home in any fork-delta core firmware. Every `http(s)://` hit was a documentation/datasheet reference comment; no raw IPs, no beacons. |
| Covert exfil of captured secrets | security | The crown-jewel question: does anything emit captured keys/dumps over radio/BLE/UART without user action? No. | ✗ | ✗ | ✗ | ✗ | **No such path in any fork.** mfkey / NFC / SubGhz results stay local on SD. No auto-emission of captured material. (High confidence — fork-deltas were swept directly.) |
| Obfuscated / encoded payloads | security | Hidden encoded blobs in source. Only standard base64 alphabet + legitimate crypto xor. | ✗ | ✗ | ✗ | ✗ | No obfuscated payloads. base64/xor hits were the standard alphabet (find_my) and legit Crypto1 / Nice FloR-S rolling-code math. |
| Time bombs / date-gated logic | security | Date- or time-triggered hidden behavior. None — all RTC code is legitimate. | ✗ | ✗ | ✗ | ✗ | No date-triggered logic. All RTC/date code is clock UI, RPC datetime, and transit-card parsing. |
| Hardcoded sensitive keys (Keeloq) | security | Larger Keeloq keystore — but AES-encrypted, no plaintext leaked. | minimal | encrypted | encrypted | encrypted | Forks ship a larger keystore (62→116 records) but it is **AES-encrypted**; the AES key is **slot 1** of the STM32WB55 secure enclave (CKS, factory-provisioned, not software-readable) — not in the repo. No plaintext keys leaked. The full cryptographic chain (hardware key → enclave → keystore decrypt → per-brand learning algos like Jarolift), with GitHub permalinks, is documented in **CRYPTO-CHAIN.md**; enclave threat-model + on-device-oracle caveat in **SECURITY.md → Secure enclave (CKS)**. Related nodes: `rc-kq-keys`, `rc-kq-learn`. |
| Hardcoded 3rd-party API key | security | Momentum's stock-ticker toy app ships the developer's own AlphaVantage key (low). | ✗ | ✗ | ✗ | flagged | `flip_trader_callback.c:84` embeds `apikey=2X90WLEFMP43OJKE` — a leak of the **developer's own** credential, not any user secret. Severity: low (F-MOM-SEC-01). |
| BLE-HID pairing-PIN suppression | security | BadBT auto-confirms the BLE pairing PIN — scoped to the user-launched attack tool. | ✗ | flagged | flagged | flagged | `suppress_pin_screen` makes `bt.c:95/112` skip the Verify-code dialog and auto-accept pairing. Set only by BadUSB BLE-HID mode (`bad_usb_hid.c:165/196`); flag is global for that window. Weakens pairing MITM-confirmation but is a deliberate, user-launched feature — not covert. Low. |
| RPC-while-locked toggle | security | Momentum opt-in to allow RPC access while the device is locked (default OFF). | ✗ | ✗ | ✗ | flagged | Momentum-only opt-in (`rpc.c:389-392`), default OFF (F-MOM-SEC-02). Official blocks unconditionally; U/R audits found no locked-RPC toggle. |
| External network apps (ESP32/WiFi) | security | Opt-in WiFi apps that send user-authored data — not captured secrets, not fork-unique. | ✗ | ✗ | flagged | flagged | User-triggered ESP32/WiFi packs (JBlanked). Endpoints are app self-update/store + host-side AirTag tooling (user's own iCloud). No captures exfiltrated. |

---

## Relationships (structural graph)

How capabilities decompose into shared primitives. 77 edges.


**modulated with** (`uses-modulation`)

- Official base protocols → OOK / ASK
- Keeloq decode → OOK / ASK
- Jarolift clone+TX → OOK / ASK
- hormann_bisecur → 2-FSK
- beninca_arc → OOK / ASK
- honeywell → 2-FSK
- Weather-station pack → 2-FSK
- TPMS pack → 2-FSK
- POCSAG / pager pack → 2-FSK
- AM270 → OOK / ASK
- AM650 → OOK / ASK
- FM238 → 2-FSK
- FM476 → 2-FSK
- FM12K (custom) → 2-FSK
- ISO14443-A → Load modulation (13.56)

**encoded with** (`uses-encoding`)

- Official base protocols → Princeton (te)
- Official base protocols → PWM / RAW timing
- Keeloq decode → PWM / RAW timing
- Weather-station pack → Manchester (SubGhz)
- TPMS pack → Manchester (SubGhz)
- ISO14443-A → Modified Miller
- ISO14443-A → Manchester (card→reader)
- ISO15693 → PPM 1-of-4 / 1-of-256
- FeliCa → Manchester (card→reader)

**uses preset** (`uses-preset`)

- Keeloq decode → AM650
- FSK 12 kHz modulation (FM12K) → FM12K (custom)

**secured by** (`secured-by`)

- Keeloq decode → Keeloq NLF
- Jarolift clone+TX → Keeloq NLF
- jarolift → Keeloq NLF
- hormann_bisecur → AES-128
- Hörmann BiSecur clone+TX → AES-128
- beninca_arc → AES-128
- Official base set → Crypto1
- MfUltralight-C 3DES key-page write → 3DES / DES
- emv → 3DES / DES
- Keeloq emulate / clone / TX → Keeloq NLF

**runs on** (`runs-on`)

- Official base protocols → CC1101 (sub-GHz)
- Keeloq decode → CC1101 (sub-GHz)
- Weather-station pack → CC1101 (sub-GHz)
- POCSAG / pager pack → CC1101 (sub-GHz)
- External CC1101 extended range → CC1101 (sub-GHz)
- Extended frequency range → CC1101 (sub-GHz)
- Official base set → ISO14443-A
- MfUltralight-C 3DES key-page write → ISO14443-A
- emv → ISO14443-4 (APDU)
- ntag4xx → ISO14443-A
- type_4_tag → ISO14443-4 (APDU)
- ISO14443-A → ST25R3916 (13.56)
- ISO14443-B → ST25R3916 (13.56)
- ISO14443-4 (APDU) → ISO14443-A
- ISO15693 → ST25R3916 (13.56)
- FeliCa → ST25R3916 (13.56)
- Magic-card writing (nfc_magic) → ISO14443-A
- iso15693_nfc_writer → ISO15693
- esubghz_chat → CC1101 (sub-GHz)
- nfc_fuzzer → ISO14443-A

**attacks** (`attacks`)

- Mfkey32 nonce capture → Crypto1
- On-device mfkey app (in tree) → Crypto1
- MIFARE Classic key dictionary → Crypto1
- mifare_fuzzer → Crypto1

**provides** (`provides`)

- Keeloq manufacturer keystore → Keeloq NLF
- nfc_magic → Magic-card writing (nfc_magic)
- nfc_magic → Magic-card writing (nfc_magic)
- mfkey → On-device mfkey app (in tree)
- mfkey → On-device mfkey app (in tree)
- nfc_dicts_manager → MIFARE Classic key dictionary
- subghz_bruteforcer → Bruteforce / BinRAW
- tpms_reader → TPMS pack
- weather_station → Weather-station pack
- pocsag_pager → POCSAG / pager pack
- gps_nmea → Subdriving (GPS geotag)
- ulc_relay → MfUltralight-C 3DES key-page write
- weather_station / tpms / pocsag apps → Weather-station pack
- weather_station / tpms / pocsag apps → TPMS pack
- weather_station / tpms / pocsag apps → POCSAG / pager pack
- ProtoPirate → Keeloq decode

**derives device key for** (`derives-key-for`)

- Keeloq learning / derivation algos → Keeloq NLF

---
_Built 2026-06-07 · 120 nodes (76 capabilities + 44 structural/FAP) · 77 relations. See `PROVENANCE.md` and `index.html`._
