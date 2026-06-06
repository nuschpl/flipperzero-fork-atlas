# Security / Covert-Behavior Audit — MOMENTUM (fork-delta vs OFFICIAL)

Scope: code ADDED/CHANGED in Momentum relative to OFFICIAL (`c9ab2b68`),
focused on NFC, SubGhz, and any communications path. Static analysis only.
Repo: `Next-Flip/Momentum-Firmware`.

## Bottom line

**No covert exfiltration found.** No code path takes captured secrets
(NFC keys/dumps, SubGhz rolling codes, mfkey/dictionary results) and emits them
over radio/BLE/UART/network without explicit user action. The cross-reference
search for "reads a capture dir AND has a network/BLE/Telegram send" returned
**empty**.

The Momentum fork-delta is dominated by:
1. UX/cosmetic core code (`lib/momentum/`: settings, asset packs, RGB backlight,
   menu styles, device-name spoof) — all local, user-set.
2. Expanded NFC parsing/cloning (EMV transactions, more transit cards, MFC
   show-keys, NFC write scene) — all **local**, no network path.
3. A large catalog of **third-party external apps** (245 dirs under
   `applications/external/`). Several are network apps, but they are well-known
   community apps shared across all Flipper fork catalogs (not Momentum-unique),
   require an attached ESP32/WiFi board, and only act on explicit user trigger.

Two minor, non-covert items worth noting (see findings): a hardcoded
third-party (developer's own) AlphaVantage API key, and an opt-in
"allow RPC while locked" toggle that defaults OFF.

---

## What was checked and cleared

### 1. Core firmware comms layer — clean
- `targets/f7/furi_hal/furi_hal_bt.c`: diff vs official = **one line** (include
  fix `furi_hal_bus.c`→`.h`). No covert GATT/advertising data channel.
- `targets/f7/ble_glue/gap.h`: diff = adds one enum member `GapPairingCount`.
- `applications/main/` delta: NO http/net/telemetry/beacon additions. Deltas are
  UX (archive search/info, badusb USB/BLE name+VID/PID spoof config, GPIO I2C
  scanner, IR universal remotes). All local.

### 2. NFC core (`lib/nfc/`, `applications/main/nfc/`) — clean, local only
- Fork adds EMV (`lib/nfc/protocols/emv`, `type_4_tag`, `ntag4xx`),
  `nxp_native_command`, many transit-card parser plugins
  (charliecard, ventra, smartrider, saflok, zolotaya_korona[_online], …),
  scenes `nfc_scene_emv_transactions.c`, `nfc_scene_mf_classic_show_keys.c`,
  `nfc_scene_write.c`.
- All "comms"-looking grep hits in NFC code are **reference URLs in comments**
  (github/wikipedia/defcon) or **substring matches** (e.g. "esp" inside words).
  Verified: e.g. `gallagher_util.c:4`, `myki.c:3-5`, `saflok.c:1-8`.
- `zolotaya_korona_online.c`: "online" is the **card brand name** (Russian
  transit); file is pure local MFC parsing, no network (only license-URL comment
  at line 18).
- `nfc_scene_mf_classic_show_keys.c` displays recovered keys **on the device
  screen** (user action) — not transmitted.
- mfkey/nested recovery results stay local; no path forwards them anywhere.

### 3. SubGhz — covered in subghz-rollingcode.md; no covert TX of captured data
- Decode→TX upgrades exist (faac_slh, somfy, nice_flor_s, alutech, jarolift,
  hormann_bisecur) but all are **user-initiated** "send" actions, same model as
  official's user-initiated TX. No automatic re-broadcast of captured codes.

### 4. External network apps — opt-in, user-triggered, not Momentum-unique
URL sweep over `applications/external/` surfaced endpoints, all belonging to
explicit network apps:
- **JBlanked / FlipperHTTP family** (`flip_social`, `flip_world`, `flip_trader`,
  `flip_library`, `flip_weather`, `flip_telegram`, `flip_wifi`): talk to
  `jblanked.com/flipper/api/...`, alphavantage, open-meteo, api.telegram.org,
  wikipedia, etc. These require an ESP32 WiFi dev board running FlipperHTTP and a
  user opening the app + triggering a fetch. No boot-time beacon. The data sent
  is user-typed (search queries, social posts, bot tokens loaded from SD) — not
  captured NFC/SubGhz secrets.
  - `flip_telegram/run/run.cpp:773,825`: uses `"https://api.telegram.org"` with a
    **user-supplied** bot token loaded from SD (`loadChar("token",…)`), not
    hardcoded. (Earlier raw-grep output showed truncated strings like `n.org` /
    `apikey=n` — confirmed a tool **display artifact**; the on-disk source is
    intact and benign.)
- **WiFi companion apps** (`evil_portal`, `ghost_esp`, `esp8266_deauth`,
  `esp_flasher`, `flipper_blackhat`): the Flipper acts only as a **UART terminal**
  to an ESP32 running Marauder/Evil-Portal/etc. Credential capture (if any)
  happens on the ESP32; the Flipper firmware itself does no capture/exfil.
  Verified `evil_portal` is a console frontend (no `storage`/POST of creds in the
  Flipper-side code).
- **`ble_spam`**: emits only synthetic advertising payloads (Apple/Android/Samsung
  pairing spam). Grep for stored/captured data in payload = **empty**. No
  captured secrets carried.
- **`esubghz_chat`**: AES-encrypted SubGhz chat over **user-typed text**; grep for
  reading nfc/subghz dump dirs = **empty**.

### 5. Indicator sweeps — negative
- **Raw IPv4 / C2 IPs**: none. All `N.N.N.N` hits are **ASN.1 OIDs** from
  EMV/mbedtls cert parsing (e.g. `2.16.840.1`, `4.1.311.20`).
- **Time bombs / date gates** in `lib/momentum` + core: none.
- **Obfuscation / xor blobs / base64 payloads** in the delta: none of note.
- **system()/exec at flash time**: none in device code.

### 6. Build/CI scripts — inherited from upstream, maintainer-side
- `scripts/send_firebase_notification.py`, `scripts/map_analyse_upload.py`,
  `scripts/selfupdate.py` all **exist identically in OFFICIAL** (not Momentum
  additions). Firebase notify needs a maintainer service-account file passed as
  arg; map-analyse upload URL is a required CLI arg (no hardcoded host); these
  run in CI, are not bundled into firmware, and never touch user secrets.

---

## Findings (flag-don't-convict)

### F-MOM-SEC-01 — Hardcoded third-party AlphaVantage API key (sensitive-exposure, low)
`applications/external/flip_trader/callback/flip_trader_callback.c:84`
```
snprintf(url,128,"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%s&apikey=2X90WLEFMP43OJKE", ...)
```
The stock-quote feature ships the **app developer's own** free-tier AlphaVantage
key in clear. This is a leak of the *developer's* credential (abuse/rate-limit
risk for them), NOT exfiltration of *user* secrets. `flip_library` uses the same
endpoint with an empty key. Low severity; not covert.

### F-MOM-SEC-02 — Opt-in "RPC while locked" toggle (suspicious-but-cleared, low)
`applications/services/rpc/rpc.c:389-392` gates RPC sessions while the device is
locked behind `momentum_settings.allow_locked_rpc_usb/ble`. Official blocks
locked-RPC unconditionally; Momentum adds a user toggle. **Defaults OFF**
(`lib/momentum/settings.c`), requires deliberate user opt-in. Weakens the
locked-device posture only if the user enables it. Low severity, not covert.
(Note: raw-grep display rendered these field names truncated as `n_usb`/`n_ble`;
the actual source uses `allow_locked_rpc_usb`/`_ble` — display artifact.)

### F-MOM-SEC-03 — Device name spoofing (benign-cleared)
`lib/momentum/namespoof.c` sets the Flipper's **own** advertised BLE/USB name
from a local SD file (`NAMESPOOF_PATH`). Changes only the device's self-identity;
no data exfil. Benign.

### F-MOM-SEC-04 — JBlanked/FlipperHTTP network apps (benign-cleared)
Numerous `jblanked.com` API endpoints (social feed, friends, location/update in
the `flip_world` multiplayer game, etc.). All gated behind: ESP32 board present +
user opens app + user action. Send user-authored content only, never captured
NFC/SubGhz secrets. Not Momentum-unique (same apps in other fork catalogs).
Benign for this audit's scope (covert firmware exfil), though users should know
these are live third-party telemetry-capable network services.
