# SubGhz Rolling-Code, Security-Sensitive Remotes & TX/Region Restrictions

Scope: keeloq + keeloq_common learning algos, jarolift, hormann_bisecur, faac_slh,
secplus_v1/v2, somfy_keytis/telis, nice_flor_s, star_line, kia, alutech_at_4n,
scher_khan; the encrypted `keeloq_mfcodes` keystore; and TX/region/frequency
restriction removal.

Forks: O=official (`c9ab2b68`), U=unleashed, R=roguemaster, M=momentum.
Working-tree paths under `…/src/<fork>-firmware/`. All file:line cited against the
current working tree (ground truth). Confidence stated where derived.

---

## 1. Rolling-code / security-sensitive protocols: presence & capability

### 1.1 Presence matrix (source file + registry membership)

Registry: `lib/subghz/protocols/protocol_items.c`. Presence verified by file
existence AND `&subghz_protocol_<name>` in the registry array.

| Protocol | O | U | R | M | Notes |
|---|---|---|---|---|---|
| keeloq | yes | yes | yes | yes | core rolling-code engine (all forks) |
| keeloq_common (lib) | yes | yes | yes | yes | learning/derivation algos — see §1.3 |
| jarolift | **no** | yes | yes | yes | added in forks; uses keeloq learning |
| hormann_bisecur | **no** | **no** | yes | yes | **R/M only** (absent in O and U) |
| faac_slh | yes (RX-only) | yes (+TX) | yes (+TX) | yes (+TX) | TX added in forks |
| secplus_v1 | yes (+TX) | yes (+TX) | yes (+TX) | yes (+TX) | TX in all |
| secplus_v2 | yes (+TX) | yes (+TX) | yes (+TX) | yes (+TX) | TX in all |
| somfy_keytis | yes (RX-only) | yes (+TX) | yes (+TX) | yes (+TX) | TX added in forks |
| somfy_telis | yes (RX-only) | yes (+TX) | yes (+TX) | yes (+TX) | TX added in forks |
| nice_flor_s | yes (RX-only) | yes (+TX) | yes (+TX) | yes (+TX) | TX added in forks |
| alutech_at_4n | yes (RX-only) | yes (+TX) | yes (+TX) | yes (+TX) | TX added in forks |
| star_line | yes | **REMOVED** | **REMOVED** | **REMOVED** | RU car alarm — see §1.4 |
| kia | yes | **REMOVED** | **REMOVED** | **REMOVED** | KIA seed — see §1.4 |
| scher_khan | yes | **REMOVED** | **REMOVED** | **REMOVED** | RU car alarm — see §1.4 |

R and M ship **byte-identical** source for every one of these protocols
(md5 match across R/M for keeloq.c, jarolift.c, hormann_bisecur.c, faac_slh.c,
secplus_v1/v2.c, somfy_*.c, nice_flor_s.c, alutech_at_4n.c). U differs from R/M
only by lacking hormann_bisecur and by minor per-file deltas.

### 1.2 Capability matrix — decode-only vs clone/emulate/TX

The decisive flag is `SubGhzProtocolFlag_Send` (enables on-device transmit/emulate).
Extracted from each protocol's `.flag = …` initializer.

| Protocol | Official flags | Fork flags (U/R/M) | Capability change |
|---|---|---|---|
| keeloq | Decodable, Load, **Send** | Decodable, Load, Save, **Send** | +Save |
| jarolift | (n/a) | Decodable, Load, Save, **Send** | new, full TX |
| hormann_bisecur | (n/a) | Decodable, Load, Save, **Send** (R/M) | new, full TX |
| faac_slh | Decodable only | Decodable, Load, Save, **Send** | **RX-only → TX** |
| secplus_v1 | Decodable, Load, **Send** | Decodable, Load, Save, **Send** | +Save |
| secplus_v2 | Decodable, Load, **Send** | Decodable, Load, Save, **Send** | +Save |
| somfy_keytis | Decodable only | Decodable, Save, **Send** | **RX-only → TX** |
| somfy_telis | Decodable only | Decodable, Save, **Send** | **RX-only → TX** |
| nice_flor_s | Decodable only | Decodable, Load, Save, **Send** | **RX-only → TX** |
| alutech_at_4n | Decodable only | Decodable, Load, Save, **Send** | **RX-only → TX** |
| star_line / kia / scher_khan | Decodable only | (removed) | n/a |

Citations (official RX-only → fork TX):
- faac_slh: O `faac_slh.c:64-65` (`…Decodable,`) → U `faac_slh.c:86-88`
  (`…Decodable | …Load | …Save | …Send`).
- alutech_at_4n: O `alutech_at_4n.c:71` (`…Decodable`) → U `alutech_at_4n.c:80-81`
  (`…Decodable | …Load | …Save | …Send`).
- somfy_keytis/telis, nice_flor_s: same RX-only→Send pattern (flag scan across forks).

**Headline:** the forks convert five previously decode-only rolling-code garage/gate
remote protocols (faac_slh, somfy_keytis, somfy_telis, nice_flor_s, alutech_at_4n)
into **clone/emulate/transmit-capable**, and add two more TX-capable rolling-code
protocols (jarolift everywhere; hormann_bisecur in R/M). Official remains decode-only
for those five.

### 1.3 keeloq_common learning / key-derivation algorithms

`lib/subghz/protocols/keeloq_common.c` — md5: O `cd20cc1e…`; U=R=M `c87b1211…`
(**byte-identical across all three forks**). O=127 lines, forks=236 lines.

Functions present (verified by symbol scan):

| Function | O | U/R/M | Purpose |
|---|---|---|---|
| `…_normal_learning` | yes | yes | standard Keeloq key derivation |
| `…_secure_learning` | yes | yes | secure (seed-based) derivation |
| `…_magic_xor_type1_learning` | yes | yes | XOR-type manufacturer derivation |
| `…_magic_serial_type1/2/3_learning` | yes | yes | serial-based derivation |
| `…_encrypt` / `…_decrypt` | yes | yes | Keeloq block cipher core |
| `…_faac_learning` | **no** | **yes** | FAAC SLH key derivation |
| `…_learning_aerf` | **no** | **yes** | AERF manufacturer learning |
| `…_learning_erreka` | **no** | **yes** | Erreka manufacturer learning |
| `…_learning_pujol` | **no** | **yes** | Pujol manufacturer learning |
| `…_decrypt_derived` | **no** | **yes** | derived-key decrypt path |

Forks add **5** key-derivation/"learning" routines absent from official. These let
the firmware derive per-manufacturer keys (and decrypt/clone) for additional vendors
without precomputed keys. Jarolift TX consumes these directly
(`jarolift.c:190-192,239-241,593-595` call `…_normal_learning` then `…_encrypt`/
`…_decrypt`).

Provenance (path-scoped pickaxe, from prior FINDINGS, re-confirmed):
`learning_pujol` introduced in unleashed commit `63d49b6e4` "subghz upgrades
[ci skip]" (MX, 2026-04-21, omnibus commit). FAAC learning predates it. R/M carry
the file byte-identical → inherited from U.

**No plaintext key material** is embedded in keeloq_common.c — it contains
algorithms, not key tables.

### 1.4 Removed protocols: star_line / kia / scher_khan (RU car alarms)

All three exist in official (`lib/subghz/protocols/{star_line,kia,scher_khan}.{c,h}`,
registered at `protocol_items.c`). **Deleted from all three forks** (source files
absent; no `&subghz_protocol_{star_line,kia,scher_khan}` anywhere under
`lib/subghz`).

Removal commit (unleashed, path-scoped `git log -- lib/subghz/protocols/star_line.c`):
`50b5ee103` **"bipki removal procedure"** by **MX, 2026-01-12**. The diff deletes
kia.c (-276), kia.h (-74), scher_khan.c (-320), scher_khan.h (-74), star_line.c
(-747), star_line.h (-109) plus their unit-test fixtures
(`kia_seed_raw.sub`, `scher_khan_magic_code.sub`, `cenmax_raw.sub`) and registry/
docs entries. Commit message body: *"don't worry, they are in other app"* — i.e.
the RU car-alarm ("bipki") protocols were moved out of base firmware into a separate
external FAP. R/M inherit the removed state.

Note: these were **decode-only** in official anyway (no Send flag), so this is a
de-scoping/legal-distancing move, not a capability loss for cloning.

---

## 2. The encrypted Keeloq manufacturer keystore (`keeloq_mfcodes`)

Path: `applications/main/subghz/resources/subghz/assets/keeloq_mfcodes`.

### 2.1 File format & encryption

Header (plaintext), confirmed by reading first lines of each file:
```
Filetype: Flipper SubGhz Keystore File
Version: 0
Encryption: 1
IV: <16 hex bytes>
<one hex line per encrypted record…>
```
- `Encryption: 1` = AES (the loader enum `SubGhzKeystoreEncryptionAES256`,
  `subghz_keystore.c:27`). Key lives in the **device secure enclave**
  (`furi_hal_crypto_enclave_load_key(SUBGHZ_KEYSTORE_FILE_ENCRYPTION_KEY_SLOT,…)`,
  `subghz_keystore.c:125`) — **not present in the repo**. Repo cannot be decrypted
  off-device. No decryption attempted (per rules).
- IVs differ per fork and are jokey ASCII: O = `48 69 69 69 2C 20 4D 69 73 68 61
  21 21 30 31 21` = `"Hiii, Misha!!01!"`; U = `2E 2E 2E 4D 65 6F 77 20 4D 65 6F 77
  20 4F 77 4F` = `"...Meow Meow OwO"`. The IV is mangled at load by an inline-asm
  routine (`subghz_keystore_mess_with_iv`, `subghz_keystore.c:87-113`) carrying a
  "Please do not share decrypted manufacture keys … potential legal action" comment.

### 2.2 Record-count derivation (size/structure, NO decryption)

Loader logic (`subghz_keystore.c:131-166`): the file is read line-by-line;
**each hex line is one encrypted record** decrypted independently
(`furi_hal_crypto_decrypt(encrypted_line,…)` at line 151), then parsed by
`subghz_keystore_process_line` → `sscanf(line, "%16s:%hu:%64s", skey, type, name)`
(`subghz_keystore.c:71-79`) i.e. one `man64:type:name` record per line.
Therefore **#records == #hex lines**. Each line length is a multiple of 32 hex chars
(= 16-byte AES blocks; comment at line 138: "32 instead of 16 because of hex
encoding").

Measured (working tree):

| Fork | file size | hex payload bytes | **record lines (= # mfg keys)** | block-size split (2/3 blocks) | md5 |
|---|---|---|---|---|---|
| Official | 4466 B | 2144 | **62** | 52×2-block + 10×3-block | `8951e6dd…` |
| Unleashed | 8296 B | 4032 | **116** | 96×2-block + 20×3-block | `c4d8342f…` |
| Roguemaster | 8296 B | 4032 | **116** | (same) | `c4d8342f…` |
| Momentum | 8296 B | 4032 | **116** | (same) | `c4d8342f…` |

Arithmetic check: O 52×32B + 10×48B = 1664+480 = 2144 B ✓; U 96×32B + 20×48B =
3072+960 = 4032 B ✓. U/R/M keystores are **byte-identical** (same md5) → forks ship
one shared, enlarged keystore.

**Conclusion:** Official ships **62** manufacturer-key records; all three forks ship
**116** (~1.87×). Confidence: **high** (record count is exact — one line = one
record, structurally guaranteed by the loader). The *cleartext keys themselves remain
AES-encrypted at rest*; the repo does **not** leak plaintext Keeloq manufacturer
keys — it ships a larger *encrypted* keystore. (The plaintext keys are independently
known in the community, but that is out of repo scope.)

### 2.3 `keeloq_mfcodes_user.example` — real keys vs placeholders

Path: same dir, `…_user.example`. O 576 B / `db487f02…`;
U=R=M 723 B / `ceaf7a02…` (forks identical).

Contents are **pure placeholders** in every fork:
```
AABBCCDDEEFFAABB:1:Test1
AABBCCDDEEFFAABB:1:Test2
```
(O lines 11-12; U lines 15-16). `Encryption: 0` (plaintext template for user-added
keys). **No real key material.** The fork delta (576→723 B) is **expanded comments
only**: the fork header documents the new learning method IDs
(`5 - FAAC SLH, 6/7/8 - Magic Serial typ1/2/3`, U `…_user.example:7-9`) that
correspond to the keeloq_common additions in §1.3. Confidence: **high**.

---

## 3. TX & REGION / FREQUENCY RESTRICTION REMOVAL

Core HAL: `targets/f7/furi_hal/furi_hal_subghz.c`; region HAL:
`targets/f7/furi_hal/furi_hal_region.c`; region service:
`applications/services/region/region.c`.

### 3.1 Official baseline (the guard being removed)

`furi_hal_subghz.c` (official):
- `furi_hal_subghz_is_frequency_valid` (`:338-346`): allows only standard ISM bands
  **300–348 / 387–464 / 779–928 MHz**.
- `furi_hal_subghz_set_frequency` (`:362-367`): sets `regulation = TxRx` **only if
  `furi_hal_region_is_frequency_allowed(value)`** — region is mandatory.
- `furi_hal_subghz_tx` (`:305-306`) and packet TX (`:691-692`) hard-return false
  unless `regulation == SubGhzRegulationTxRx`.
- Region is provisioned over-the-air via the region service
  (`applications/services/region/region.c`) and `furi_hal_region.c` (152 lines,
  real band tables, md5 `9a0894d0…`).

### 3.2 Comparison of how each fork dismantles the guards

| Mechanism | Official | Unleashed | Roguemaster | Momentum |
|---|---|---|---|---|
| `is_frequency_valid` range | 300-348/387-464/779-928 (ISM) | **281-361/378-481/749-962** (YARD Stick) | same as U | same as U |
| Region HAL `furi_hal_region.c` | real band tables (152 L) | **gutted stub, always-allow (53 L)** | retained + bypass hook (144 L) | retained + bypass hook (158 L) |
| Region service `region.c` | present | **deleted** | **deleted** | present |
| `is_frequency_allowed` consulted in TX gate? | **yes (mandatory)** | **no** (call removed) | optional (`bypass_region`) | optional (`bypass_region`) |
| Default TX band (widened) | n/a | 300-350/387-467.75/779-928 | same | same |
| Extended/"dangerous" range toggle | none | `dangerous_frequency_i` | `extended_range` | `extended_range` |
| Region bypass toggle | none | (n/a — already always-allow) | `bypass_region` | `bypass_region` |
| Unlock asset (SD, default OFF) | none | `dangerous_settings` | `extend_range.txt` | `extend_range.txt` (gen at runtime) |
| RX protocol-filter bypass `ignore_filter` | **absent** | present (6 files) | present (8 files) | present (8 files) |

### 3.3 Unleashed — region service fully neutralized at HAL level

- `furi_hal_region.c` is reduced to a hard-coded stub
  (`furi_hal_region.c:4-53`): single region `"00"`, one band **0–1,000,000,000 Hz**,
  `furi_hal_region_is_frequency_allowed()` **`return true;`** (`:42-45`),
  `furi_hal_region_is_provisioned()` **`return true;`** (`:47-49`). The region lock is
  dead regardless of any user setting.
- TX gating rewritten: `furi_hal_subghz_is_tx_allowed` (`:396-413`) checks a widened
  default range (300-350 / 387-467.75 / 779-928 MHz, `:399-402`); if the SD flag
  `dangerous_frequency_i` is set it instead allows the full YARD Stick range via
  `is_frequency_valid` (`:405-408`). `set_frequency` (`:415-420`) feeds `regulation`
  from this — the official `furi_hal_region_is_frequency_allowed` call is **gone**.
- `is_frequency_valid` widened to 281-361/378-481/749-962 MHz (`:371-379`) with the
  comment *"Modified by @tkerby & MX to the full YARD Stick One extended range …
  PLL may not lock and FZ devs have warned of possible damage!"* (`:366-369`).
- Unlock asset `dangerous_settings`
  (`applications/main/subghz/resources/subghz/assets/dangerous_settings`):
  key `yes_i_want_to_destroy_my_flipper: false` (ships **OFF**). Loaded at boot by
  `subghz_dangerous_freq.c:16-21` → `furi_hal_subghz_set_dangerous_frequency`.

### 3.4 Roguemaster / Momentum — region retained but user-bypassable

R and M share the same logic (md5-identical `check_tx`):
- `furi_hal_subghz_check_tx` (R `:411-441`, M `:402-...`): three-tier check —
  (1) `is_frequency_valid` (YARD Stick hard limit) → `SubGhzTxUnsupported`;
  (2) widened default range unless `extended_range` → `SubGhzTxBlockedDefault`;
  (3) **region check skipped entirely if `bypass_region`** — otherwise requires
  `furi_hal_region_is_provisioned()` AND `_furi_hal_region_is_frequency_allowed()`
  (R `:428-437`).
- Two HAL toggles added: `furi_hal_subghz_set_extended_range` / `set_bypass_region`
  (R `:79-92`), backed by struct bits `extended_range` / `bypass_region`
  (R `:56-57`), both default **false** (R `:66-67`).
- Unlock asset `extend_range.txt`
  (`…/resources/subghz/assets/extend_range.txt`, R) with two keys, both `false`:
  `use_ext_range_at_own_risk` (→ extended_range) and `ignore_default_tx_region`
  (→ bypass_region). Loaded at boot by `subghz_extended_freq.c:19-26`
  (`flipper_format_read_bool` → the two setters). Momentum has no static asset file;
  it generates `/ext/subghz/assets/extend_range.txt` at runtime via its settings app
  (`momentum_app.c:72,389`), defaults false.
- `region.c` service deleted in R (like U) but the region *band-table* HAL is kept;
  M keeps both the service and HAL.

### 3.5 Receive-side: `ignore_filter`

All three forks add `ignore_filter` (a `SubGhzProtocolFlag` mask) that bypasses the
receiver's protocol allow-filter so blocked/disabled protocols still decode. E.g.
unleashed `subghz_last_settings.c:16` (`"IgnoreFilter"` field), `subghz.c:222,227`,
`subghz_i.h:82`, applied in `subghz_scene_receiver.c:108`
(`(decoder_base->protocol->flag & subghz->ignore_filter) == 0`). **Absent in
official** (0 files). This is RX-only (does not affect TX legality) but broadens what
the device will demodulate/decode.

### 3.6 cc1101_ext (external CC1101 module driver)

`applications/drivers/subghz/cc1101_ext/cc1101_ext.c` mirrors the same range logic
for an external radio module. U: `extended_range` field + compile-time
`SUBGHZ_DEVICE_CC1101_EXT_FORCE_DANGEROUS_RANGE false` (`:22,96,515-526`). R/M:
`extended_range` field with the same YARD-Stick range comment (`:97,224-229,
528-557`). Same unlock posture as the internal radio.

---

## Summary of capability deltas (security-relevant)

1. **Decode → clone/TX upgrade**: forks add `Send` to faac_slh, somfy_keytis,
   somfy_telis, nice_flor_s, alutech_at_4n (official: decode-only). Plus
   TX-capable jarolift (all forks) and hormann_bisecur (R/M).
2. **Key-derivation expansion**: keeloq_common gains 5 learning/derivation routines
   (faac, aerf, erreka, pujol, decrypt_derived) enabling more rolling-code cloning
   without precomputed keys. Byte-identical across U/R/M.
3. **Larger encrypted keystore**: 62 → 116 manufacturer-key records (encrypted at
   rest; no plaintext leaked in repo; user.example is placeholders only).
4. **TX/region locks removed**: U neutralizes the region HAL entirely (always-allow
   stub) + widens TX to the YARD Stick range; R/M keep region but add a
   user-toggleable `bypass_region` + `extended_range`. All extended/dangerous toggles
   **ship OFF by default** (SD-card opt-in). The official mandatory
   `furi_hal_region_is_frequency_allowed` TX gate is removed/bypassable in every fork.
5. **De-scoping**: RU car-alarm protocols (star_line, kia, scher_khan) removed from
   all forks ("bipki removal", moved to external app).

### Key citations
- Capability flags: `lib/subghz/protocols/<proto>.c` `.flag =` initializers
  (O faac_slh.c:64-65 vs U faac_slh.c:86-88; O alutech_at_4n.c:71 vs U :80-81).
- Learning algos: `lib/subghz/protocols/keeloq_common.c` (O 127 L vs forks 236 L);
  jarolift consumers jarolift.c:190-192,239-241,593-595.
- Protocol removal: unleashed `50b5ee103` "bipki removal procedure" (MX 2026-01-12).
- Keystore: `lib/subghz/subghz_keystore.c:27,71-79,87-113,125,131-166`; asset
  `keeloq_mfcodes` (O 62 lines / forks 116 lines).
- Region/TX: O furi_hal_subghz.c:338-367; U furi_hal_subghz.c:366-420 +
  furi_hal_region.c:4-53 (stub); R/M furi_hal_subghz.c:411-445; toggles
  subghz_dangerous_freq.c (U), subghz_extended_freq.c (R/M); assets
  dangerous_settings (U), extend_range.txt (R/M).
