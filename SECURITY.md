# SECURITY.md — Covert-Behavior & Malicious-Implant Audit

Comparative security audit of four Flipper Zero firmwares against the OFFICIAL upstream baseline.

| Repo | HEAD audited | Baseline |
|------|--------------|----------|
| OFFICIAL | `c9ab2b68` | (baseline) |
| UNLEASHED | `318bfc3b` | vs OFFICIAL |
| ROGUEMASTER | fork-delta | vs OFFICIAL + Unleashed |
| MOMENTUM | (ex-Xtreme) | vs OFFICIAL `c9ab2b68` |

Method: subtree diffs of `lib/`, `applications/{main,system,services}`, `targets/f7/{furi_hal,ble_glue}`; indicator sweeps (URLs, IPv4, base64/xor blobs, BLE beacon/GAP/GATT, SubGhz TX, UART/serial, exec, RTC time-gates, region unlock); each hit read in the working-tree source (ground truth). Per-repo detail lives in `sections/security-{unleashed,roguemaster,momentum}.md`. Static analysis only — no sample or built artifact was executed.

---

## EXECUTIVE VERDICT

**No firmware exhibits covert exfiltration or a malicious implant.** Overall confidence: **HIGH** for the core firmware (`lib/`, `applications/main`, `applications/services`, BLE/RPC/UART HAL) of all three forks; **MODERATE-HIGH** for the large bundled external-app packs (RogueMaster ~665 apps, Momentum ~245 apps), which were prioritized by comms/secret-handling relevance rather than read exhaustively.

The central ("crown-jewel") question was: *does any code path take a captured secret — NFC keys/dumps, SubGhz rolling codes, mfkey/dictionary results — and emit it over radio/BLE/UART/network without explicit user action?* The cross-reference of "reads a capture directory AND has a send path" returned **EMPTY in every fork.** No telemetry / phone-home, no hardcoded C2, no obfuscated payload blobs, no time-bombs (no RTC date-gated logic), no exec-at-flash.

What the forks *do* add are **overt, advertised, user-driven capability expansions** — broader SubGhz TX range and region-lock removal, offensive HID/BadBT tooling, additional RF/NFC protocol decoders, and a catalog of well-known community network apps that require an attached ESP32/WiFi board and transmit only user-authored content. These are capability-exposure items, not covert behavior.

Confirmed findings worth a user's attention are all **LOW severity**:
- UNLEASHED — BLE pairing-PIN auto-confirm, scoped strictly to the BadBT HID tool.
- MOMENTUM — a hardcoded *developer's* third-party AlphaVantage API key in a bundled community stock-quote app (no user-secret exposure).

Two items initially flagged as "suspicious" were **refuted** on close reading and demoted to false-positive notes (RogueMaster "AES BiSecur"; Momentum "allow locked RPC"). See the false-positives note at the end.

---

## UNLEASHED

### Confirmed findings

#### [LOW] UNL-SEC-003 — BLE pairing-PIN screen suppression / auto-confirm scoped to BadBT HID mode
- **File:** `applications/services/bt/bt_service/bt.c:95`, `108-126`
- **Introduced commit:** `849f14e48` ("Bad BT plugin, Submenu locked elements, API updates, etc.")
- **Category:** suspicious (security-relevant UX)
- **Severity:** low · **Confidence:** 0.9 · **VERDICT: CONFIRMED**

**Evidence.** `bt.c:95` `if(bt->suppress_pin_screen) return;` skips drawing the PIN viewport in `bt_pin_code_show`. `bt_pin_code_verify_event_handler` (`bt.c:108-126`) returns `true` at line 112 (`if(bt->suppress_pin_screen) return true;`) — auto-accepting pairing before the `dialog_message_show` "Verify code\n%06lu" Cancel/OK prompt is ever reached. The `bool suppress_pin_screen;` field (`bt_i.h:92`) is fork-added; OFFICIAL has no occurrence of it anywhere and unconditionally shows the dialog (official `bt.c:87-121`).

The flag is written in exactly two places repo-wide, both inside the BadBT/BadKB tool: `applications/main/bad_usb/helpers/bad_usb_hid.c:165` (`=true`, `hid_ble_init`) and `:196` (`=false`, `hid_ble_deinit`). No RPC/CLI/remote/network path can set it. It is reset to `false` on teardown, so normal Flipper-as-peripheral pairing (mobile app) still shows the dialog.

**Reasoning.** This weakens the on-device pairing confirmation, but only within the user-launched HID-injection tool, where the Flipper acts *as* a keyboard pairing *to* a user-chosen target. The host's own pairing acceptance is untouched; the Flipper merely auto-confirms its own local prompt. No secret is read, stored, or exfiltrated; no covert/remote trigger; no data channel. Attacker-convenience UX inherent to an intentionally offensive tool — real and worth documenting for transparency, but benign in intent and tightly scoped. Low is appropriate.

### Cleared / ruled-out

- **UNL-SEC-001 [info] — No covert exfiltration of captured secrets (crown-jewel negative).** Grep over the NFC/mfkey/subghz delta for `extra_beacon_set_data|subghz_tx|furi_hal_subghz_start_async_tx|cli_write|furi_hal_serial_tx` found no matches in key-recovery/capture code. mfkey (`applications/system/mfkey/mfkey.c`) computes keys locally and writes to SD on user action; NFC pollers and the SubGhz worker do not auto-broadcast captured material. Confidence 0.9.
- **UNL-SEC-002 [info] — find_my_flipper BLE beacon emulator broadcasts only user-imported payload.** `applications/system/find_my_flipper/findmy_state.c:94-143`: `findmy_state_apply()` sets BLE extra-beacon data from a user-edited config (or an empty AirTag template, `:71-84`); the only auto-modified byte is the device's own battery level (`:94-113`). `furi_hal_bt_extra_beacon` is an upstream HAL capability (OFFICIAL ships `example_ble_beacon`). The bundled `base64.c` is the standard alphabet, not obfuscation. Introduced `95483fb56`. Confidence 0.95.
- **UNL-SEC-004 [low] — SubGhz region lock removed + TX range extended.** `lib/subghz/subghz_setting.c:210` ("Region check removed") loads a permissive default; `targets/f7/furi_hal/furi_hal_subghz.c` (~`furi_hal_subghz_is_tx_allowed`) extends allowed TX to the full YARD Stick One range (281–361 / 378–481 / 749–962 MHz), attributed in-source to @tkerby & MX. Deliberate, advertised feature; TX still requires explicit user action via the SubGhz app/CLI. Regulatory/legal implications out of scope. Introduced `84d12da45`. Confidence 0.95.
- **UNL-SEC-005 [info] — NXP native-command helper is legitimate protocol support.** Unleashed-only `lib/nfc/helpers/nxp_native_command.{c,h}` + `_mode.h` implement ISO-7816 / NXP native command wrapping, used by mf_desfire, ntag4xx, mf_plus pollers. Pure protocol plumbing; no comms side channel. Confidence 0.95.
- **UNL-SEC-006 [info] — Indicator sweep clear.** All http(s) hits in the delta are doc/reference comments (TI e2e, phreakerclub, datasheets, wikipedia, flipper docs); no raw IPv4; no `system`/`execve`/`popen`/`fork`; xor loops are legit crypto (`crypto1.c`, `nice_flor_s.c` rolling code); only base64 is the standard alphabet; RTC/date code is clock UI / RPC datetime / transit-card parsing with no date-triggered logic. CLI/RPC/GAP/expansion diffs are typo/whitespace/cosmetic or benign feature additions. Confidence 0.9.

---

## ROGUEMASTER

Lineage confirmed: RM = Unleashed + a ~665-app external pack. The `lib/` and `applications/main/` deltas vs OFFICIAL are almost entirely inherited verbatim from Unleashed, with small RM-specific additions (rgb_backlight, Hitag1 LFRFID, hormann_bisecur / telcoma_edge / x10 SubGhz, GPIO I2C scanner, nfc_cli, subghz_gps, cfw settings).

### Confirmed findings

*None.* (The single non-cleared item below was reviewed and refuted — see false positives.)

### Cleared / ruled-out

- **rm-sec-001 [info] — No covert exfiltration of captured secrets (crown-jewel).** Cross-section of apps that both read captures (mf_classic_dict / .nfc / subghz load / keeloq_mfcodes / mfkey) and have comms (flipper_http / furi_hal_serial_tx / furi_hal_bt / wifi) = {amiibo_toolkit, flipblinky, flipkeyboard, flippass, flipsignal, flipsimon, nfc_login, nfctools, seader, seos_compatible}. Each examined: all comms are user-initiated or app-purpose; none silently harvests stored captures and emits them. Confidence 0.85 (pack sampled by relevance, not exhaustively read).
- **rm-sec-002 [info] — Core firmware: no telemetry, phone-home, exec, or obfuscation.** `rg telemetry|analytics|exfil|beacon.*key|auto.upload|phone.home` over `.c/.h` → only 802.15.4/Zigbee vendor struct fields in `lib/stm32wb_copro`. No `system()`/`popen()`/`execve()`/`/bin/sh` in `lib/` or `applications/main/`. No base64 blobs ≥120 chars in subghz/nfc/lfrfid additions. Confidence 0.95.
- **rm-sec-003 [info] — subghz_gps: RX-only NMEA geotagging, no TX.** `applications/main/subghz/helpers/subghz_gps.c:224` calls `furi_hal_serial_async_rx_start` only; the worker parses NMEA via minmea and stores lat/lon locally to tag captures. No `furi_hal_serial_tx` of captured data anywhere. Confidence 0.95.
- **rm-sec-004 [info] — nfc_cli APDU prints to local CLI only; field cmd debug-gated.** `applications/main/nfc/nfc_cli.c:33-37` adds `nfc apdu` (response via `printf` to the attached CLI) and a `field` subcommand gated behind `furi_hal_rtc_is_flag_set(FuriHalRtcFlagDebug)` (`:34`). Output goes only to the USB/CLI console the user is already connected to. Confidence 0.9.
- **rm-sec-005 [low] — seader / seos_compatible UART = documented HID Seos SAM reader bridge.** `applications/external/seader/uart.c:194` `furi_hal_serial_tx(...)` fires only on `WorkerEvtSamRx` inside a user-started worker, forwarding APDUs to/from an external HID SAM module (`seos_compatible/uart.c:193` identical). Overt, user-driven; not covert exfil. Confidence 0.85.
- **rm-sec-006 [low] — BLE HID token-typing apps (nfc_login, flippass) emit user-chosen values.** `applications/external/flippass/plugins/flippass_output_ble_plugin.c:189`, `nfc_login/hid/nfc_login_hid_ble.c:58,161` start BLE-HID advertising and type a user-selected value to a paired host — equivalent to OFFICIAL's existing BLE HID. Not a silently harvested secret. Confidence 0.85.
- **rm-sec-007 [low] — Purpose-built BLE-advertising apps broadcast app-data, not stored captures.** ble_spam, find_my_flipper, droidbeacon, disn3y_toolbox, bthome, evil_ble — each payload is the app's own purpose (notification spam, AirTag emulation, Disney droid/MagicBand beacons, BTHome sensor frames). None reads stored NFC/SubGhz captures. Confidence 0.8.
- **rm-sec-008 [low] — JBlanked WiFi apps HTTP-over-UART: self-update/store only, only hw revision sent.** `applications/external/flipsocial/update/update.c:284,431` → `https://www.jblanked.com/flipper/api/app/last-updated/%s/` and `/download/%s/` (same in flipwifi/flipstore). The only device datum sent is `furi_hal_version_get_hw_target()` (`:418`) — hw revision, **no serial, no captures.** `flipper_http.c` is a generic HTTP-over-UART bridge to an ESP32, transmitting only what the app passes. Confidence 0.8.
- **rm-sec-009 [info] — find_my_flipper AirTagGeneration is host-side Python using the user's own iCloud.** `AirTagGeneration/cores/pypush_gsa_icloud.py:30` `ANISETTE_URL="http://localhost:6969"`; `RequestReport&Map.py` posts to `gateway.icloud.com/acsnservice/fetch` with the user's own iCloud login to pull the user's own AirTag reports. Runs on the user's PC, not firmware. Standard OpenHaystack-style tooling. Confidence 0.9.
- **rm-sec-010 [info] — URL/IP sweep surfaced no covert C2.** Hostnames are license headers (gnu.org/apache.org), standards (rfc-editor/nist/ietf), vendor docs (st.com/microchip/atmel), GitHub links, plus the JBlanked/iCloud endpoints above. `rac.so` appears only as an on-screen game credit (`sokoban/scripts/scene_credits.c:82`). Raw-IPv4 matches were ASN.1/SNMP OIDs (`1.3.6.1...`), version numbers, EMV tag tuples — no hardcoded server IPs. Confidence 0.85.
- **rm-sec-012 [info] — cfw settings framework (namespoof, UART channel selectors) is benign.** `lib/cfw/namespoof.h:3-5` reads BLE/USB device name from local `dolphin/name.txt` (cosmetic spoof); `cfw.h:57-58` adds only `uart_esp_channel` / `uart_nmea_channel` selectors; `private.h` exposes `cfw_settings_load()` only. No network identity, telemetry, or device-ID beacon. Shared with Momentum. Confidence 0.9.

---

## MOMENTUM

(ex-Xtreme.) Core BLE HAL essentially unchanged (1-line include fix in `furi_hal_bt.c`; `gap.h` adds one enum count). `applications/main/` deltas are UX (archive search, badusb name/VIDPID spoof config, GPIO I2C scanner, IR universals). Entire NFC delta (EMV, transit cards, MFC show-keys, NFC write) is local parsing/cloning. SubGhz adds user-initiated decode→TX upgrades only.

### Confirmed findings

#### [LOW] F-MOM-SEC-01 — Hardcoded third-party AlphaVantage API key in flip_trader stock-quote app
- **File:** `applications/external/flip_trader/callback/flip_trader_callback.c:84`
- **Introduced commit:** none in Momentum superproject — pulled via the `applications/external` git submodule (third-party "Momentum Apps"/community bundle; app author `JBlanked`, `fap_weburl=https://github.com/jblanked/FlipTrader`)
- **Category:** sensitive-exposure
- **Severity:** low · **Confidence:** 0.93 · **VERDICT: CONFIRMED**

**Evidence.** Line 84 verbatim: `snprintf(url, 128, "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%s&apikey=2X90WLEFMP43OJKE", asset_names[asset_index]);` — a live AlphaVantage free-tier key shipped in cleartext. The app is absent from official/unleashed/roguemaster working trees. The `flip_trader` path is not individually git-tracked in the Momentum superproject (pulled via submodule), consistent with "imported upstream snapshot, no Momentum-introduced commit."

**Correction to original evidence:** the finding claimed `flip_library` uses the same endpoint with an *empty* key — this is FALSE. `flip_library_callback.c:536` reuses the *exact same* hardcoded key `2X90WLEFMP43OJKE`. This reinforces (rather than weakens) the verdict: it is a single developer's credential reused across his own community apps.

**Reasoning.** The key belongs to the app *developer*, not the user — risk is abuse/rate-limiting against JBlanked, not exfiltration of user secrets. Behavior is user-initiated (opening FlipTrader with a WiFi board attached) and hits a legitimate documented public endpoint. Not covert; benign with respect to user security. Correctly rated LOW.

### Cleared / ruled-out

- **F-MOM-SEC-03 [info] — NFC core delta is local-only.** `diff -rq` vs official shows added EMV (`lib/nfc/protocols/emv`, type_4_tag, ntag4xx), transit plugins, `nfc_scene_mf_classic_show_keys.c`, `nfc_scene_write.c`. `rg furi_hal_bt_/furi_hal_serial/https/flipper_http` across `applications/main/nfc/` matched ONLY comment URLs (`gallagher_util.c:4`, `myki.c:3-5`, `saflok.c:1-8`) and substrings (`zolotaya_korona_online.c` — "online" is the card brand). Recovered MIFARE keys are shown on-screen (user action); dumps/EMV parsed locally; nothing forwarded to any radio/network. Confidence 0.95.
- **F-MOM-SEC-04 [info] — Core BLE/RPC layer unchanged.** `targets/f7/furi_hal/furi_hal_bt.c` diff vs official = single line (`furi_hal_bus.c` → `.h`); `targets/f7/ble_glue/gap.h` adds one enum member (`GapPairingCount`). No new GATT characteristic or advertising payload carrying device data. The most valuable place for a covert channel is essentially identical to upstream. Confidence 0.95.
- **F-MOM-SEC-05 [info] — External network apps carry no captured secrets.** URL sweep surfaced `jblanked.com/flipper/api/*`, alphavantage, open-meteo, `api.telegram.org` (user-supplied token via `loadChar('token',...)` at `flip_telegram/run/run.cpp:773,825`). Cross-ref "reads nfc/subghz dump dir AND has network/BLE/Telegram send" = EMPTY. ble_spam = synthetic pairing spam only; esubghz_chat reads typed text not dumps; evil_portal is a UART console frontend to ESP32 (no Flipper-side cred capture/POST). Well-known community apps shared across all fork catalogs, requiring an attached ESP32/WiFi board and explicit user action, transmitting user-authored content only. Confidence 0.85.
- **F-MOM-SEC-06 [info] — No raw C2 IPs, time bombs, or obfuscation.** IPv4 sweep returned only ASN.1 OIDs (`2.16.840.1`, `4.1.311.20`, `4.2.1.x`) from EMV/mbedtls cert parsing. No `furi_hal_rtc_get_datetime` date gates in `lib/momentum/core`. No notable base64/xor blobs. No exec at flash time in device code. Confidence 0.9.
- **F-MOM-SEC-07 [info] — CI/maintainer scripts inherited from upstream.** `scripts/send_firebase_notification.py`, `scripts/map_analyse_upload.py`, `scripts/selfupdate.py` all exist *identically* in OFFICIAL. firebase notify needs a maintainer service-account file (`--token_file`); `map_analyse_upload.py` posts to a required `--analyser_url` CLI arg (no hardcoded host); `selfupdate.py` has no network calls. Maintainer-side tooling, not bundled into firmware, never touches user secrets, not a Momentum addition. Confidence 0.9.

> **Tooling note (not a finding):** the Momentum audit's raw `ripgrep -o` output produced truncated display artifacts (e.g. `n.org`, `apikey=n`, struct field `n_usb`). Reading the on-disk source confirmed the real content is intact (`api.telegram.org` with user-supplied token; `allow_locked_rpc_usb`). These were tool display quirks, **not obfuscation.**

---

## False positives (initially suspicious, refuted on close reading)

These were flagged during triage and demoted after reading the actual code. Documented so they are not re-raised.

#### rm-sec-011 — "AES BiSecur" / RM-specific RF capability additions → REFUTED (info)
- **File:** `lib/subghz/protocols/hormann_bisecur.c` · Confidence 0.9
- `hormann_bisecur.c` (RM, lines 1–709, md5 `3a469b746a02687d1d24dfac4222a906`, byte-identical in RM and Momentum, absent from official/unleashed) is a textbook SubGhz decoder/encoder using the standard `SubGhzProtocolDecoder/Encoder` framework. It contains **NO AES/encryption/decryption/crypto whatsoever** (`grep aes|encrypt|decrypt|crypto` returns nothing). The "AES BiSecur" label is a misread: the code does Manchester decode/encode, CRC8 validation (`626-652`), and an XOR *display-hash* (`587-593`) of the captured raw frame. It is capture/replay of the over-the-air frame (which the genuine remote itself encrypts) — it does **not** break AES. Momentum's "extend encrypted data hash to 2 bytes" merely widens the history-list display hash. Provenance is overt and attributed (header credits jamisonderek; PR from upstream author user890104; registered openly in `protocol_items.c:46`). telcoma_edge / x10 / hitag1 and the attack-app pack (evil_portal, esp8266_deauth, wifi_deauther, carjacker, can_bus_attack, nrf24*) all exist as plainly-named, non-hidden directories under `applications/external/`. Everything is overt, named, user-driven capability exposure — not covert or malicious. The finding is self-refuting as a security issue.

#### F-MOM-SEC-02 — "Allow RPC while locked" toggle weakens locked-device posture → REFUTED (info)
- **File:** `applications/services/rpc/rpc.c:388-392` · Confidence 0.9
- The cited Momentum code is accurate but the premise ("Official blocks locked-RPC unconditionally; Momentum relaxes it") is **backwards**, inverting the conclusion. OFFICIAL `rpc.c:385-421` has **no lock check whatsoever** in `rpc_session_open`; `FuriHalRtcFlagLock` is consulted only by `desktop.c`, never by RPC. Both RPC entry points (`rpc_cli.c:50` USB, `bt.c:273` BLE) open sessions regardless of lock state. Unleashed and RogueMaster likewise have no lock gating. **Momentum is the only one of the four forks that blocks RPC while locked:** it default-denies (`lib/momentum/settings.c:17-18` both `false`) and offers an opt-in toggle (`momentum_app_scene_interface_lockscreen.c:147-159`, default OFF). Git history confirms the direction — `a7151dc46` introduced a default-OFF deny; `34379f1fb` (PR #343) merely split one bool into separate USB/BLE toggles. Momentum *adds* hardening upstream lacks and exposes a user opt-out — it does not weaken posture relative to baseline; it strengthens it. The only residual note is the generic truth that any user-enabled "allow locked RPC" is an attack surface — a surface that is wide open by default in the other three forks.

---

## Severity index (confirmed findings only)

| ID | Repo | Severity | Verdict | Title |
|----|------|----------|---------|-------|
| UNL-SEC-003 | unleashed | LOW | confirmed | BLE pairing-PIN auto-confirm, scoped to BadBT HID |
| F-MOM-SEC-01 | momentum | LOW | confirmed | Hardcoded developer AlphaVantage API key (flip_trader, community app) |

No MEDIUM, HIGH, or CRITICAL findings in any firmware. No confirmed covert exfiltration, telemetry, C2, time-bomb, or implant.
