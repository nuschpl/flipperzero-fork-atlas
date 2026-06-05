# Security / covert-behavior audit — ROGUEMASTER (fork-delta vs OFFICIAL)

Date: 2026-06-05. Method: static analysis only. Code is ground truth; every claim
cites file:line. Baseline = OFFICIAL `c9ab2b68`. Comparator forks = UNLEASHED,
MOMENTUM.

## Scope / lineage confirmed
- RogueMaster (RM) = **Unleashed + a very large bundled external-app pack**.
  - `lib/` and `applications/main/` deltas vs OFFICIAL are almost entirely
    **inherited verbatim from Unleashed** (SubGhz protocol pack, Keeloq learning,
    NFC EMV/type4, etc. — already covered in keeloq/subghz notes).
  - True RM-vs-Unleashed core additions are small and capability-only:
    `lib/drivers/rgb_backlight.*`, `lib/lfrfid` Hitag1/Insta-fob protocols,
    `lib/subghz/protocols/{hormann_bisecur,telcoma_edge,x10}.*`,
    `lib/toolbox/colors.*`, `lib/cfw/*`, GPIO I2C scanner, IR universal scenes,
    `applications/main/nfc/nfc_cli.c`, `applications/main/subghz/helpers/subghz_gps*`.
  - UNLEASHED does **not** bundle `applications/external/` at all; RM ships **665**
    external apps (`ls applications/external | wc -l = 665`). These are the
    community apps catalog (largely shared with Momentum's flipper-application-catalog).

## Crown-jewel question
**Does any RM-added path emit captured secrets (NFC keys/dumps, SubGhz rolling
codes, dict results) over radio/BLE/UART/network WITHOUT explicit user action?**
**Answer: No such path found.** All comms paths examined are either user-initiated
(HID typing, reader bridges, social/store apps) or carry app-purpose data, not
silently-harvested captures.

## Core firmware telemetry / exfil
- Sweep for `telemetry|analytics|exfil|beacon.*key|auto.?upload|phone.?home` over
  `lib/ applications/main/ applications/services/` (.c/.h) → **zero hits** except
  802.15.4/Zigbee protocol struct fields (`a_beacon_key_source` etc. in
  `lib/stm32wb_copro/...`), which are vendor MAC-layer definitions, not telemetry.
- No `system()/popen()/execve()/bin/sh` in `lib/` or `applications/main/`.
- No long base64 blobs / encoded payloads in core SubGhz/NFC/LFRFID additions.
- `lib/cfw/` (settings framework, shared with Momentum): benign.
  `namespoof.h` reads BLE/USB device name from local `dolphin/name.txt` (cosmetic);
  `cfw.h` only adds UART channel selectors (`uart_esp_channel`, `uart_nmea_channel`).
  No network identity, no device-ID beacon. (`lib/cfw/{cfw.h,namespoof.h,private.h}`)

## Comms-relevant items examined (all CLEARED)

### subghz_gps (RX-only UART) — benign
`applications/main/subghz/helpers/subghz_gps.c`. Acquires UART
(`cfw_settings.uart_nmea_channel`), starts **async RX only**
(`furi_hal_serial_async_rx_start`, subghz_gps.c:224), parses NMEA via minmea, and
geotags captures locally. **No TX of any captured data.** Distance/direction math
only. Cleared.

### nfc_cli (`applications/main/nfc/nfc_cli.c`) — benign
Adds a `nfc apdu` CLI command (send APDU, print response) + debug-gated `field`.
Output goes to the local USB/CLI console the user is already attached to; `field`
is gated behind `FuriHalRtcFlagDebug` (nfc_cli.c:34). No autonomous emission.
Cleared.

### seader / seos_compatible — UART SAM bridge, user-driven
`applications/external/seader/uart.c:194`, `seos_compatible/uart.c:193`:
`furi_hal_serial_tx` forwards APDUs to/from an external HID SAM module — the
documented HID Seos reader protocol. TX only fires on `WorkerEvtSamRx` in a worker
the user starts. Purpose-built reader feature, not covert. Cleared.

### BLE HID / token-typing apps — user-initiated, like OFFICIAL BLE HID
`nfc_login` (`hid/nfc_login_hid_ble.c`), `flippass`
(`plugins/flippass_output_ble_plugin.c`), `amiibo_toolkit` BLE scene: advertise as
BLE HID and **type a value the user chose** to a paired host. Equivalent to
OFFICIAL's existing BLE HID. The emitted value is user-selected, not a silently
harvested secret. Cleared.

### Purpose-built BLE-advertising apps — app-data, not captures
`ble_spam`, `find_my_flipper`, `droidbeacon`, `disn3y_toolbox`, `bthome`,
`nestbridge`, `magicband_plus`, `evil_ble`: set custom BLE advertising payloads,
but the payloads are each app's own purpose (notification spam, AirTag emulation,
Disney droid/MagicBand beacons, BTHome sensor frames). None reads stored NFC/SubGhz
captures and broadcasts them. Cleared (these are advertised features).

### WiFi-dev-board HTTP apps (JBlanked stack) — user-driven, no secret exfil
`flipsocial`, `flipwifi`, `flipstore`, `fliplibrary`, `flipworld`, etc. talk HTTP
**over UART to an ESP32 WiFi dev board** via the bundled `flipper_http` library.
- Backend = `www.jblanked.com/flipper/api/app/{last-updated,download}/%s`
  (`flipsocial/update/update.c:284,431`; same in flipwifi/flipstore) = app
  self-update + store download. Well-known JBlanked community service.
- Only device datum sent is `furi_hal_version_get_hw_target()` (hw revision) in the
  update path (`flipsocial/update/update.c:418`) — **no unique serial, no captures.**
- `flipper_http.c` is a generic HTTP-over-UART bridge; it transmits only what the
  calling app explicitly passes. No automatic harvesting of `.nfc`/`.sub` files.
Cleared (user opens these social/store apps deliberately).

### find_my_flipper AirTagGeneration — host-side, user's own creds
`applications/external/find_my_flipper/AirTagGeneration/*.py` runs on the user's PC
(requests/cryptography), logs into the user's **own** iCloud via a localhost
anisette server (`cores/pypush_gsa_icloud.py:30 ANISETTE_URL="http://localhost:6969"`)
and queries `gateway.icloud.com/acsnservice/fetch` to pull the user's own AirTag
location reports. Standard OpenHaystack-style tooling. Not firmware code, not
exfil. Cleared.

### URL/IP indicator sweep — no covert endpoints
- All hostnames in .c/.h/.py are license headers (gnu.org, apache.org),
  standards refs (rfc-editor, nist, ietf), vendor docs (st.com, microchip, atmel),
  GitHub source links, or the JBlanked/iCloud endpoints above. `rac.so` appears
  only as an on-screen game-author credit (`sokoban/scripts/scene_credits.c:82`,
  drawn via `canvas_draw_str`, not a network call).
- Raw-IPv4 sweep returned only ASN.1/SNMP OIDs (1.3.6.1…), version numbers, and
  EMV tag tuples — no hardcoded C2/server IPs.

## RM-specific sensitive *capabilities* (added, not covert)
These expand offensive capability but are overt, user-driven features (note for
completeness, not flagged as covert):
- `lib/subghz/protocols/hormann_bisecur.*` (AES BiSecur gate remote) — RM/M only.
- `lib/subghz/protocols/{telcoma_edge,x10}.*` — telcoma_edge is RM-only.
- `lib/lfrfid/protocols/protocol_hitag1.*` + `lfrfid_hitag_worker.*` (Hitag1) — RM.
- Large bundled attack-app pack (evil_portal, wifi/esp deauth, ble_spam,
  can_bus_attack, carjacker, nrf24 tools, etc.). All overt tools.

## Bottom line
No covert exfiltration, telemetry, time-bomb, obfuscation, or
captured-secret-over-comms path was found in RogueMaster's fork-delta. The
fork-delta is (a) Unleashed-inherited SubGhz/NFC capability and (b) a very large
pack of overt community apps. Comms paths are user-initiated and carry app-purpose
data; the only network endpoints are app self-update/store (JBlanked) and host-side
AirTag tooling (user's own iCloud). Confidence: high for the core firmware and the
comms-relevant apps sampled; the 665-app pack was prioritized (not exhaustively
read) per task scope, so residual risk in unsampled game/utility plugins is low but
non-zero.
