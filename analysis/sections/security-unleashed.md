# Security / Covert-Behavior Audit — UNLEASHED (fork-delta vs OFFICIAL)

Scope: code ADDED/CHANGED in `unleashed-firmware` relative to `official-firmware`
(local OFFICIAL HEAD `c9ab2b68`, 2025-12-01; UNLEASHED HEAD `318bfc3b`, 2026-06-04),
prioritizing NFC, SubGhz, and all communications paths (BLE/GAP/GATT, USB/BLE-HID,
UART/expansion, RPC, CLI). Static analysis only.

## Method

1. `diff -rq` between matching subtrees (`lib/`, `applications/main`,
   `applications/system`, `applications/services`, `targets/f7/furi_hal`,
   `targets/f7/ble_glue`), filtering binary/asset extensions. Result:
   154 differing `.c/.h/.py` files plus a set of unleashed-only source files.
2. Ripgrep indicator sweeps over the working tree (blobs already checked out):
   `https?://`, raw IPv4, base64 blobs (>60 chars), xor loops, `furi_hal_bt` /
   BLE beacon/GAP/GATT payloads, subghz async TX of stored data, UART/serial
   writes, `system()/exec/popen/fork`, RTC date gates (time bombs), region/TX
   unlocking, hidden/debug menus.
3. Read surrounding code for every hit; classified benign vs anomalous against the
   OFFICIAL baseline.

## CROWN-JEWEL QUESTION — answered

> Does any path take captured secrets (NFC keys/dumps, SubGhz rolling codes,
> dictionary results) and emit them over radio/BLE/UART/network WITHOUT explicit
> user action?

**No such path was found.** All emission of data over BLE/SubGhz/UART in the
fork-delta is either (a) explicitly user-initiated, or (b) carries only
user-supplied / non-secret content. Specifically:
- `applications/system/mfkey/mfkey.c` computes MIFARE keys locally and writes
  results to SD on user action; it contains **no** BLE/SubGhz/UART/CLI transmit
  of the recovered keys (grep for `extra_beacon_set_data|subghz_tx|cli_write|
  furi_hal_serial_tx` in nfc/mfkey delta returned nothing).
- NFC pollers and the SubGhz worker do not auto-broadcast captured material.

## Findings (notable items, all cleared or low-concern)

### 1. find_my_flipper — Apple/Samsung/Tile beacon emulator (BLE) — BENIGN
- Files: `applications/system/find_my_flipper/` (unleashed-only). Introduced
  unleashed commit `95483fb56` "add findmy to system apps" (MX, 2025-02-13).
- Uses the BLE "extra beacon" HAL (`furi_hal_bt_extra_beacon_set_data/start`),
  which is **upstream/official** — official ships `applications/examples/
  example_ble_beacon` and `targets/f7/ble_glue/extra_beacon.c` using the same API.
- Broadcast payload is **user-imported only**: the user manually enters a payload
  + MAC captured from their own tag (`scenes/findmy_scene_config_import.c`,
  `findmy_state_load`). Default state is an empty AirTag template
  (`findmy_state.c:71-84`). The only auto-modified byte is the Flipper's own
  battery level (`findmy_state_update_payload_battery`, `findmy_state.c:94-113`).
- No captured NFC/SubGhz secret is sourced into the beacon. The base64 table in
  `helpers/base64.c` is the standard alphabet (Apple public-key encoding), not an
  obfuscation blob. **Verdict: benign; public "FindMy Flipper" project.**

### 2. BLE-HID pairing-PIN suppression (`suppress_pin_screen`) — LOW / BENIGN
- `applications/services/bt/bt_service/bt.c:95` and `:112` skip showing /
  auto-confirm the BLE pairing PIN screen when `bt->suppress_pin_screen` is set.
  `bt_pin_code_verify_event_handler` returns `true` (accept) without the
  user-visible "Verify code" dialog when the flag is on (`bt.c:108-126`).
- The flag is set **exclusively** by BadUSB's BLE-HID mode:
  `applications/main/bad_usb/helpers/bad_usb_hid.c:165` (`= true`) and `:196`
  (`= false`). Introduced with the BadBT plugin (`849f14e48`).
- Interpretation: this is UX for the (intentional, user-launched) BadBT/BadKB
  HID-injection tool — the Flipper pairs *as a keyboard* to a target the user
  selected; suppressing the on-Flipper PIN dialog streamlines that attack. It
  does weaken on-device pairing confirmation, but it is scoped to a deliberate
  attack feature and does NOT establish a covert data channel or exfiltrate
  secrets. **Verdict: low concern, expected fork behavior; not covert.**
- Related: `bt_open_rpc_connection`/`bt_close_rpc_connection` promoted to public
  API (`bt.c:375,399`, `bt_i.h:99,105`). This is the standard RPC-over-BLE-serial
  session (present in official as static logic), refactored for reuse. Benign.

### 3. SubGhz region lock removed + extended TX frequency range — BENIGN (expected)
- `lib/subghz/subghz_setting.c:210` comment "Region check removed";
  `subghz_setting_load_default_region` loads a permissive default
  (introduced `84d12da45`). Geographic TX region locking is dropped.
- `targets/f7/furi_hal/furi_hal_subghz.c` (~line 396, `furi_hal_subghz_is_tx_allowed`)
  extends the allowed range to the "full YARD Stick One" 281-361/378-481/749-962
  MHz (attributed in-source to @tkerby & MX; merge `9ed23799e`).
- This is the widely-advertised unleashed capability expansion (more TX freqs,
  no region gate). It is a deliberate feature, not covert behavior; TX still
  requires explicit user action via the SubGhz app/CLI. **Verdict: benign in the
  covert-behavior sense (legal/regulatory implications are out of scope here).**

### 4. NFC NXP native-command helper (DESFire/NTAG4xx/MF Plus) — BENIGN
- `lib/nfc/helpers/nxp_native_command.{c,h}` + `_mode.h` (unleashed-only), used by
  `mf_desfire`, `ntag4xx`, `mf_plus` pollers. Legitimate ISO-7816/native command
  wrapping for expanded NFC protocol support. No comms side channel.

### 5. Indicator sweep — all clear
- **URLs:** every `http(s)://` hit in the app/subghz/nfc delta is a
  documentation/reference comment (TI e2e, phreakerclub, datasheets, wikipedia,
  flipper docs). No telemetry/beacon endpoints. No raw IPv4. No suspicious domains.
- **base64/xor/blobs:** only the standard base64 alphabet (find_my) and legitimate
  crypto/protocol xor (Crypto1 `lib/nfc/helpers/crypto1.c`, Nice FloR-S rolling
  code `lib/subghz/protocols/nice_flor_s.c`). No encoded payloads.
- **exec:** no `system()/execve/popen/fork` in app/lib delta (matches are the
  FeliCa `..._list_system` state-handler function names, not process exec).
- **time gates:** all RTC/date code is legitimate clock UI, RPC datetime, and
  transit-card (mosgortrans/mykey) parsing. No date-triggered logic / time bombs.
- **hid_profile / gap.c diffs:** cosmetic (whitespace reflow, typo fixes
  `advetise`→`advertise`, adv_name now includes device name). No payload change.
- **crypto_cli.c / rpc.c diffs:** typo fixes only ("NON-REVERSIBLE", "emptied").
- **expansion service diff:** adds a "connection established" callback/state for
  apps to detect module connect; no new exfil over the UART/expansion link.
- **hid_app additions** (`hid_mouse_jiggler_stealth`, `hid_movie`,
  `hid_music_macos`, `hid_numpad`, `hid_ptt*`): UI/HID feature additions; the
  "stealth" jiggler only hides on-screen UI, not a comms channel. Benign.

## Conclusion

The UNLEASHED fork-delta over OFFICIAL is consistent with its advertised purpose:
expanded SubGhz protocol/frequency support, expanded NFC protocol support, and
attacker-convenience tooling (BadBT, beacon emulation, jiggler). **No covert
exfiltration, telemetry/phone-home, obfuscated payload, time bomb, or
auto-emission of captured secrets was found.** The two items with any security
weight — pairing-PIN suppression and region/TX unlock — are both deliberate,
user-facing features scoped to intentional tools, not hidden behaviors.

Confidence: high for the crown-jewel negative (delta is bounded and was swept
directly); high for the benign classifications above (each read in source).
