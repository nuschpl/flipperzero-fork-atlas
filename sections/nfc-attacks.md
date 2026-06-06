# NFC Key-Recovery & Cloning Capability Across Forks

Scope: MIFARE Classic key-recovery (mfkey32 / nested), the bundled key dictionary,
magic-card cloning (`nfc_magic`), and other sensitive NFC tooling.

HEAD commits analyzed:
- OFFICIAL `c9ab2b68`
- UNLEASHED `318bfc3b0`
- ROGUEMASTER `ed963fd0d2`
- MOMENTUM `8ed809fba`

Confidence is stated per claim. Every nontrivial claim is verified against the working-tree
source (ground truth) with file:line citations.

---

## 0. Executive summary

| Capability | OFFICIAL | UNLEASHED | ROGUEMASTER | MOMENTUM |
|---|---|---|---|---|
| Mfkey32 nonce capture ("Detect Reader") in main NFC app | yes | yes | yes | yes |
| On-device key recovery app (`mfkey`) bundled in repo | **no** (¹) | yes (`applications/system`) | yes (`applications/external`) | yes (`applications/external`) |
| Attacks in mfkey app | n/a | mfkey32 + static_nested | mfkey32 + static_nested | mfkey32 + static_nested |
| `mf_classic_dict.nfc` valid keys | 2042 | **4082** | 2475 | 2475 |
| Magic-card writer (`nfc_magic`) bundled in repo | **no** (¹) | **no** (¹) | yes | yes |
| Magic types supported (where bundled) | n/a | n/a | Gen1A/B, Gen2, Gen4 GTU (+UL/NTAG via Gen4) | same |
| Extra sensitive NFC apps | none in-repo | none in-repo | NFC Fuzzer, Sniffer, Relay, Dict Manager, NFC Tools, etc. | (smaller set) |

(¹) "no ... in repo" means the capability is **not present in this git working tree**.
OFFICIAL distributes `mfkey` and `nfc_magic` through its separate App Hub / `flipperzero-good-faps`
catalog rather than vendoring them into the firmware tree. UNLEASHED ships `mfkey` but as a
**system** app (always-built), and does not vendor `nfc_magic`. So the *firmware tree* differs from
what an end user can ultimately install. This section reports what is in each repo.

Key lineage signal: the ROGUEMASTER and MOMENTUM key dictionaries are **byte-identical key sets**
(2475 keys, same order, same case), and their `nfc_magic` Gen4 core poller is byte-identical
(md5 `0d77609fe952d1533cc838355abefb29`). UNLEASHED and ROGUEMASTER share a byte-identical
`mfkey.c` (md5 `dfbbf8072aa32904985b625efddb3227`). These are shared-origin (subtree/manual-copy)
relationships, not independent reimplementations.

---

## 1. mfkey32 / mfkey64 / nested / hardnested / static-nested

### 1a. Nonce capture (built into the main NFC app — all four forks)

All four forks contain the mfkey32 nonce logger inside the main NFC app:

- `applications/main/nfc/helpers/mfkey32_logger.c` / `.h` — present in all four forks.
- Scenes `nfc_scene_mf_classic_mfkey_complete.c` and
  `nfc_scene_mf_classic_mfkey_nonces_info.c` — present in all four forks.

This is the "Detect Reader" feature: it sniffs `{nt, nr, ar}` authentication nonces from a real
reader and writes them to a `.nonces` file. This is upstream OFW functionality; the forks inherit it.

### 1b. On-device key-recovery app (`mfkey`)

The CPU-bound brute-force that turns captured nonces into keys lives in a separate `mfkey` app:

| Fork | Location | apptype |
|---|---|---|
| OFFICIAL | not in tree (App Hub / good-faps) | n/a |
| UNLEASHED | `applications/system/mfkey/` | `FlipperAppType.EXTERNAL` (built in-tree) |
| ROGUEMASTER | `applications/external/mfkey/` | `FlipperAppType.EXTERNAL` |
| MOMENTUM | `applications/external/mfkey/` | `FlipperAppType.EXTERNAL` |

`application.fam` for all three declares `appid="mfkey", name="MFKey"` plus a companion
`mfkey_init_plugin` (`FlipperAppType.PLUGIN`).

Origin: the app is **noproto/FlipperMfkey**, the same code Flipper Devices ships in OFW good-faps.
Cited in `applications/external/mfkey/README.md:1-22` (ROGUEMASTER):
> "This Flipper application ("FAP") cracks Mifare Classic 1K/4K keys on your Flipper Zero. No
> companion app/desktop needed. ... OFW: Available in the App Hub ... distributed by Flipper
> Devices (.../flipperzero-good-faps/.../mfkey)."

### 1c. Which attacks are implemented

The `mfkey` app implements **mfkey32** and **static_nested** only. There is no full hardnested
or darkside attack (those need a PC-class workload). Verified in
`applications/system/mfkey/mfkey.h:68-69` (UNLEASHED; identical file in ROGUEMASTER):

```
    mfkey32,
    static_nested,
```

Supporting evidence:
- `mfkey.h:56-57`: `bool mfkey32_present; bool nested_present;`
- `mfkey_recovery.c:171` `if(n->attack == mfkey32)`; `:178` `else if(n->attack == static_nested)`.
- `mfkey_bs_verify.c:446` `bs_verify_batch_32` (mfkey32 kernel), `:484` `bs_verify_batch_32_nested`
  (static-nested kernel). The header comment `mfkey_bs_verify.h:4` lists "all attack types
  (mfkey32, static_nested, ...)".
- `plugin_interface.h:8-9` exposes `napi_mf_classic_mfkey32_nonces_check_presence()` and
  `napi_mf_classic_nested_nonces_check_presence()` — i.e. it consumes both mfkey32 and nested
  nonce files produced by the main NFC app.

No string `mfkey64`, `hardnested`, or `darkside` appears as an implemented attack in any fork's
`mfkey` app (mfkey64 is the card-side variant captured/cracked via the same mfkey32 nonce flow;
the on-device cracker is bit-sliced crypto1, not a hardnested implementation).

### 1d. Code-sharing / origin (manual-copy detection)

| File | UNLEASHED md5 | ROGUEMASTER md5 | MOMENTUM md5 |
|---|---|---|---|
| `mfkey/mfkey.c` | `dfbbf8072aa32904985b625efddb3227` | `dfbbf8072aa32904985b625efddb3227` (identical) | `e11dbacd39a688cc7c84887e02ec2ebf` (differs) |
| `mfkey/crypto1.c` | `f060fce2a1228157260eb3688ec9674b` | `f060fce2a1228157260eb3688ec9674b` (identical) | `f060fce2a1228157260eb3688ec9674b` (identical) |

Interpretation (high confidence): all three forks vendor the same upstream noproto/FlipperMfkey
app. UNLEASHED and ROGUEMASTER are pinned to the same revision of `mfkey.c`; MOMENTUM is on a
slightly different revision (cosmetic/version delta) but identical crypto core. The bit-sliced
crypto1 engine is byte-identical across all three.

---

## 2. MIFARE Classic key dictionary (`mf_classic_dict.nfc`)

Path: `applications/main/nfc/resources/nfc/assets/mf_classic_dict.nfc` (plaintext, one 6-byte /
12-hex key per non-comment line).

### 2a. Counts

| Fork | total lines | valid 12-hex keys | unique keys | md5 |
|---|---|---|---|---|
| OFFICIAL | 2758 | 2042 | 2038 (4 dups) | `daca6d7652450e718f73523b58f19f5a` |
| UNLEASHED | 4497 | **4082** | 4082 | `7b14ba8d1a04f23e093bc0e85d754632` |
| ROGUEMASTER | 2902 | 2475 | 2475 | `82129197a4525374666f5de8db50a94e` |
| MOMENTUM | 3217 | 2475 | 2475 | `8c5b1d995c8012bba4b923694d14e52e` |

UNLEASHED ships by far the largest dictionary (≈2× the others). The file header
(`mf_classic_dict.nfc:4`) is dated "Last updated 11 July 2024" (UNLEASHED) vs "11 November 2025"
(ROGUEMASTER). The base is the Proxmark3 / Iceman-fork `mfc_default_keys.dic`
(header line 1 in all forks).

### 2b. Set diffs

Computed on lowercased unique 12-hex key sets:

| Comparison | keys only in A | keys only in B |
|---|---|---|
| OFFICIAL (A) vs UNLEASHED (B) | 151 (dropped by Unleashed) | 2195 (added by Unleashed) |
| UNLEASHED (A) vs ROGUEMASTER (B) | 2000 | 393 |
| ROGUEMASTER (A) vs MOMENTUM (B) | **0** | **0** |

ROGUEMASTER and MOMENTUM have **identical key sets** — same 2475 keys, same order, same
upper-case formatting (verified: key-only diff is empty; raw samples both start
`FFFFFFFFFFFF / 000000000000 / A0A1A2A3A4A5`). The only difference between the two files is the
**comment style**: ROGUEMASTER uppercases its section comments (e.g. `# HOTEL SYSTEM`,
`# GYMS / FITNESS CLUBS ...`) while MOMENTUM keeps title/sentence case (`# Hotel system`).
This is a strong shared-origin signal (same curated dict, divergent cosmetic post-processing).

### 2c. Notable fork-added key categories

The forks (especially UNLEASHED, the superset) extend the OFW dict with large blocks of
real-world transit / hotel / access-control keys. Section labels observed (UNLEASHED line refs;
ROGUEMASTER/MOMENTUM carry the same categories at shifted lines):

- Transit: `# Transport system Metromoney` (:375), `# Smart Rider. Western Australian Public
  Transport Cards` (:570/:768), `# Bangkok metro key` (:578), `# Metro Valencia key` (:580),
  `# Boston, MA, USA Transit - MBTA Charlie Card` (:790), `# Russian Troika card` (:854),
  `# Granada, ES Transport Card` (:1261), `# TAPCARD PUBLIC TRANSPORT LA` (:1058),
  `# Armenian Metro`, `# EasyCard`, `# SUBE cards`, `# Bursa / Eskisehir transport card`
  (ROGUEMASTER :1419/:1380/:1551/:1575/:1582).
- Hotel / door locks: `# Hotel system` (:138/:176/:496), `# Onity S1 A/B` (:279),
  `# Vingcard Mifare 4k Staff card` (:748), `# KABA Hotel Locks` (:764),
  `# Data from Salto A/B` (:535), `# OMNITEC.ES HOTEL TIMECARD/MAINTENANCECARD/EMERGENCYCARD`
  (:1054-1056), `# Premier Inn hotel chain`, `# Hotel Adina` (:1016), various German/Chinese hotels.
- Access control / misc: `# Access control system` (:107), `# NSP Global keys A and B (uk
  housing access control)` (:109), `# Car wash system` (:119), `# Coinmatic laundry Smart card`
  (:1253), `# Luxeo/Aztek cashless vending` (:779), gym/fitness wristbands (:247-255),
  library cards, university campus cards (`# ROTTERDAM UNIVERSITY ...`).

OFFICIAL's dict is comparatively conservative (mostly MAD/NFC-Forum defaults, EV1 signature
blocks, QL88, a handful of transit keys like Wien). The forks' additions materially broaden the
range of real-world cards whose A/B sector keys can be opened with a pure dictionary attack
(no nonce capture needed). Confidence: high (counts and labels read directly from the files).

---

## 3. Magic-card writing (`nfc_magic`)

Path: `applications/external/nfc_magic/`.

| Fork | bundled in repo? |
|---|---|
| OFFICIAL | no (App Hub / good-faps) |
| UNLEASHED | **no** (not vendored; UNLEASHED ships zero `applications/external` apps in-tree) |
| ROGUEMASTER | **yes** |
| MOMENTUM | **yes** |

Note: UNLEASHED's `applications/external/` directory is empty in-tree (0 entries) and contains no
`nfc_magic`; like OFFICIAL it relies on external app distribution. ROGUEMASTER and MOMENTUM vendor
the full app.

### 3a. Supported magic types (ROGUEMASTER & MOMENTUM)

Protocol enum `magic/protocols/nfc_magic_protocols.h:8-15`:
`NfcMagicProtocolGen1`, `NfcMagicProtocolGen2`, `NfcMagicProtocolGen4`, `NfcMagicProtocolClassic`.

Display names `magic/protocols/nfc_magic_protocols.c:6-9`:
- `NfcMagicProtocolGen1` = `"Gen1A/B"`
- `NfcMagicProtocolGen2` = `"Gen2"`
- `NfcMagicProtocolGen4` = `"Gen4 GTU"`

Protocol implementation dirs present: `magic/protocols/gen1a/`, `gen2/`, `gen4/` (plus an `oii`
poller used internally). So the app writes:
- **Gen1A/B** (classic "Chinese magic" backdoor) — `gen1a_poller.c`
- **Gen2** (direct block-0 writable) — `gen2_poller.c`
- **Gen4 GTU** (Ultimate Magic Card with password + shadow/GTU modes) — `gen4_poller.c`
- **MIFARE Ultralight / NTAG** cloning via Gen4: `gen4_poller.c:296` handles
  `NfcProtocolMfUltralight`; `:330` `Gen4UltralightModeUL_EV1`; `:364` `gen4_poller_write_mf_ultralight`;
  `:374-380` NTAG203/213 type handling. (5 ultralight refs in each fork's `nfc_magic`.)

Gen4 capability surface (`magic/protocols/gen4/gen4.h`): 32-byte config block
(`GEN4_CONFIG_SIZE 32`), 4-byte password (`GEN4_PASSWORD_LEN 4`, `gen4_password_is_set/reset/copy`),
and full shadow-mode control (`Gen4ShadowModePreWrite/Restore/Disabled/HighSpeedDisabled/Split`,
`gen4.h:38-47`). This is the high-capability "ultimate magic card" feature set (set UID, ATQA/SAK,
GTU shadow behavior, password lock).

### 3b. ROGUEMASTER vs MOMENTUM nfc_magic — shared origin

`magic/protocols/gen4/gen4_poller.c` is **byte-identical** between the two
(md5 `0d77609fe952d1533cc838355abefb29`). The two trees differ only in cosmetic/asset/UI files
(catalog screenshots, `.gitsubtree` marker present only in MOMENTUM, a few asset PNGs, and minor
edits to scene/info `.c` files and `application.fam`). The core write logic is the same vendored
upstream `nfc_magic` app. Confidence: high.

---

## 4. Other sensitive NFC capability

### 4a. mfkey ultralight dictionary

`mf_ultralight_c_dict.nfc` key counts: OFFICIAL 48, UNLEASHED 50, ROGUEMASTER 50, MOMENTUM 50
(forks add 2 keys). Minor; low significance.

### 4b. ROGUEMASTER-only / fork-extra NFC apps (`applications/external/`)

ROGUEMASTER vendors a notably larger sensitive NFC toolset than the others. Confirmed via
`application.fam` `name=` fields:

| App dir | name | sensitivity |
|---|---|---|
| `nfc_fuzzer` | "NFC Fuzzer" | UID/data fuzzing of readers |
| `nfc_sniffer` | "NFC Sniffer" | passive RF sniffing |
| `nfc_relay` | "NFC Relay" | relay/MITM of NFC transactions |
| `nfc_dicts_manager` | "NFC Dict Manager" | manage/import key dictionaries |
| `nfctools` | "NFC Tools" | general NFC utilities |
| `nfc_magic` | (magic writer) | see §3 |
| `mfkey` | "MFKey" | key recovery, see §1 |
| `nfc_apdu_runner`, `nfc_comparator`, `nfc_eink`, `nfc_keyboard`, `nfc_login`, `nfc_maker`, `nfc_playlist`, `nfc_rfid_detector`, `nfc_stock`, `nfcurl`, `networking_nfc_qr`, `iso15693_nfc_writer`, `miband_nfc_writer` | various | mixed |

MOMENTUM bundles a smaller external NFC set: `nfc_apdu_runner`, `nfc_eink`, `nfc_login`,
`nfc_magic`, `nfc_maker`, `nfc_playlist`, `nfc_rfid_detector`, `iso15693_nfc_writer`
(no fuzzer/sniffer/relay/dict-manager in-tree).
OFFICIAL and UNLEASHED bundle **no** external NFC apps in their firmware trees.

The combination present in ROGUEMASTER — mfkey recovery + magic writer + sniffer + relay +
fuzzer + the enlarged dictionary — is the broadest in-tree NFC attack surface of the four.
NFC Relay in particular enables real-time MITM/relay of live NFC sessions, which the other forks
do not vendor.

### 4c. Emulation / dump scope (inherited from OFW, all forks)

The main NFC app in every fork can save full card dumps (incl. recovered keys) to `.nfc` files
on SD and emulate MIFARE Classic from those dumps; recovered keys from the mfkey flow are
auto-appended to the user dictionary (per `mfkey/README.md`: "All cracked nonces are
automatically added to your user dictionary, allowing you to clone Mifare Classic 1K/4K cards
upon re-scanning them"). This is upstream behavior, not a fork addition. No evidence of automated
network exfiltration of dumps was found in the NFC apps reviewed (dumps stay on local SD).
Confidence: medium-high (reviewed app trees; did not exhaustively audit every external app's
network code).

---

## 5. Confidence & caveats

- High confidence on all counts, md5 comparisons, file presence/absence, and protocol/attack
  enumerations — read directly from the working tree.
- "Not in repo" for OFFICIAL/UNLEASHED (`nfc_magic`) and OFFICIAL (`mfkey`) reflects the **git
  tree only**. Those projects deliver the same apps via external catalogs, so the *effective*
  end-user capability gap is smaller than the in-tree gap suggests. The on-device cracking and
  magic-write *algorithms* are common upstream code (noproto/FlipperMfkey, OFW nfc_magic); forks
  differ mainly in (a) whether they vendor the app in-tree, (b) how large the bundled dictionary
  is, and (c) ROGUEMASTER's additional sniffer/relay/fuzzer/dict-manager apps.
- "Suspicious" vs "malicious": none of this is malware. It is dual-use security tooling that is
  standard in the Flipper ecosystem and largely upstream-derived. The fork-specific risk delta is
  primarily breadth (larger dict, more bundled attack apps in ROGUEMASTER), not novel offensive
  capability.
