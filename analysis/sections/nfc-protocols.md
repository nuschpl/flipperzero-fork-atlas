# NFC Protocol Coverage & Parsers — Cross-Fork Diff (O / U / R / M)

Scope: `lib/nfc/protocols/*` (core protocol stack) and `applications/main/nfc/plugins/supported_cards/*`
(card/transit parser plugins). Forks:
- **O** = official-firmware (HEAD `c9ab2b68`, treat as current upstream; 2025-12-01, ~6mo stale)
- **U** = unleashed-firmware
- **R** = roguemaster-firmware
- **M** = momentum-firmware (ex-Xtreme)

All claims below verified against working-tree files. md5 via `md5 -q`. Git history is path-scoped only.

---

## 1. Core protocol stack — `lib/nfc/protocols/`

### 1.1 Coverage matrix

Official base set (12 protocols) confirmed present in all four forks:
`felica, iso14443_3a, iso14443_3b, iso14443_4a, iso14443_4b, iso15693_3, mf_classic, mf_desfire, mf_plus, mf_ultralight, slix, st25tb`.

| Protocol dir | O | U | R | M | Notes |
|---|---|---|---|---|---|
| (12 base protocols above) | ✅ | ✅ | ✅ | ✅ | byte-identical base; not the subject of this diff |
| **emv** | ❌ | ✅ | ✅ | ✅ | fork-added |
| **ntag4xx** | ❌ | ✅ | ✅ | ✅ | fork-added |
| **type_4_tag** | ❌ | ✅ | ✅ | ✅ | fork-added |

**Fork-added core protocols = exactly 3, identical set across U/R/M: `emv`, `ntag4xx`, `type_4_tag`.**
No protocol is unique to any single fork at the core-stack level.

### 1.2 Enum confirmation (`lib/nfc/protocols/nfc_protocol.h`)

Official enum (`.../official-firmware/lib/nfc/protocols/nfc_protocol.h`) ends at `NfcProtocolSt25tb`
then `NfcProtocolNum`. All three forks insert the same three members in the same order, immediately
after `NfcProtocolSt25tb`:

```
NfcProtocolNtag4xx,
NfcProtocolType4Tag,
NfcProtocolEmv,
```

Verified in:
- U `.../unleashed-firmware/lib/nfc/protocols/nfc_protocol.h:189-191`
- R `.../roguemaster-firmware/lib/nfc/protocols/nfc_protocol.h` (same members)
- M `.../momentum-firmware/lib/nfc/protocols/nfc_protocol.h` (same members)

### 1.3 md5: the 3 added protocol dirs are byte-identical across U/R/M

Every source/header file in `emv/` (7 files), `ntag4xx/` (9 files), and `type_4_tag/` (14 files)
is md5-identical across U, R, M. Sample (full set checked, all SAME):

| File | md5 (U=R=M) |
|---|---|
| `emv/emv.c` | `92a05b2db6a6af3c9240fde8be7bef2f` |
| `emv/emv_poller.c` | `7729c8e03f2ca30284f846641e6d2ece` |
| `ntag4xx/ntag4xx.c` | `bac2806a3f56eaba6223603c3532a8f5` |
| `ntag4xx/ntag4xx_poller.c` | `b8c919800d1bfef3b13424c6ebda4b16` |
| `type_4_tag/type_4_tag.c` | `ed6ba39a88e4ae4927ee1d3e40ddd79d` |
| `type_4_tag/type_4_tag_poller.c` | `f731a119f8c25433f4b9070da35a7c04` |

**Conclusion:** R and M inherited these three protocols from U as-is (no independent reimplementation).
Note `type_4_tag` is the only one of the three with a full listener (card-emulation) implementation
(`type_4_tag_listener*.c`); `emv` and `ntag4xx` are poller-only (reader-side).

### 1.4 Provenance (path-scoped git log in U)

- **ntag4xx + type_4_tag**: introduced together in U commit **`fa6839d28` "nfc lib"**
  (`git log --oneline -- lib/nfc/protocols/ntag4xx/ntag4xx.c` and `.../type_4_tag/type_4_tag.c`).
  Single commit creates both → these are part of U's NFC-stack expansion, not separate features.
- **emv**: developed incrementally in U — recent touch `726cb770d "formatting"`, earlier
  feature commits `b904555eb "application interchange profile parse added"`,
  `11cfbd1ec "bruteforce sfi 2-3 records 1-5"`, `a9de06d6f "cardholder name parsing prepared"`
  (`git log --oneline -- lib/nfc/protocols/emv/emv.c`). The EMV protocol stack is U-originated
  homegrown work (payment-card reading: AIP parse, SFI record bruteforce, PAN/cardholder fields).

These are **NOT in official HEAD** (confirmed: `ls official-firmware/lib/nfc/protocols/` has none of
emv/ntag4xx/type_4_tag). Caveat: official HEAD is ~6mo stale; ntag4xx/type_4_tag correspond to OFW
work that may have landed upstream later, but as of the pinned baseline they are fork additions.

---

## 2. Card / transit parser plugins — `applications/main/nfc/plugins/supported_cards/`

Parsers are individual Flipper-application plugins, each registered as its own `App()` block in
`applications/main/nfc/application.fam`. Ground-truth count = `.c` files in the directory
(excluding the shared header `nfc_supported_card_plugin.h`).

### 2.1 Parser counts

| Fork | parser `.c` files |
|---|---|
| O | **26** |
| U | **40** |
| R | **43** |
| M | **40** |

(`application.fam` shows a few extra `sources=` entries because some plugins register 2 source files —
e.g. `emv_parser` registers `plugins/supported_cards/emv.c` + `helpers/nfc_emv_parser.c`,
M `application.fam:488`. The per-file count above is authoritative.)

### 2.2 Parsers ADDED vs official (14 shared by U/R/M)

These 14 are present in all three forks and absent in O:

`charliecard`, `csc`, `emv`, `kazan`, `metromoney`, `saflok`, `sevppk_tk`, `sk_tk`,
`smartrider`, `sonicare`, `szppk_so`, `ventra`, `zolotaya_korona`, `zolotaya_korona_online`.

Category breakdown:
- **Transit/transport:** `charliecard` (Boston MBTA), `csc`, `kazan` (RU), `metromoney` (Tbilisi),
  `smartrider` (Perth/WA), `ventra` (Chicago CTA), `zolotaya_korona` + `zolotaya_korona_online` (RU),
  `sevppk_tk`/`sk_tk`/`szppk_so` (RU regional transit, St.Petersburg/etc.).
- **Payment:** `emv` (generic EMV bank-card parser — reads PAN/expiry/transactions).
- **Access/lock:** `saflok` (Saflok hotel-door MIFARE Classic lock — keygen/derivation).
- **Consumer:** `sonicare` (Philips toothbrush head DRM tag).

### 2.3 Parsers UNIQUE to RogueMaster (3)

R ships 3 additional MIFARE Classic parsers absent from U and M:

| Parser | File | Type | Notes |
|---|---|---|---|
| `andalucia` | `roguemaster-firmware/.../supported_cards/andalucia.c` | Transit (Consorcio Andalucía, Spain) | hardcoded key `0x99100225D83B`, sector 9 |
| `hotels` | `roguemaster-firmware/.../supported_cards/hotels.c` | Hotel-lock | Saflok/VingCard/Onity key probe; `andalucia.c:11-13`-style keys: `saflok_sector1_keya=0x2A2C13CC242A`, `vingcard_sector2_keyb=0x0000014B5C31`, `onity_sector1_keya=0x8A19D40CF2B5`. `verify`/`read` are stubs returning false → parse-only. |
| `trea` | `roguemaster-firmware/.../supported_cards/trea.c` | Transit (TREA, Italy) | MfClassic 1K key table, Italian comments ("Blocco da calcolare") |

### 2.4 md5 cross-fork on the 14 shared-added parsers

12 of 14 are byte-identical across U/R/M (e.g. `emv.c`, `saflok.c`, `charliecard.c`, both
`zolotaya_korona*`). **Two diverge** — confirming independent per-fork patching, not blind copy:

| Parser | U | R | M | Divergence |
|---|---|---|---|---|
| `smartrider.c` | `4cd4a73e…` | `4cd4a73e…` (=U) | `f25e33a6…` | **M differs from U=R.** Full-file diff (M reformatted/edited). |
| `ventra.c` | `aaa715a9…` | `4118789a…` | `aaa715a9…` (=U) | **R differs from U=M.** R added a station-ID database + "FatherDivine" enhancements (month validation, two-tier bus/train stop lookup, CSV fallback at `/ext/apps_data/ventra/cta_stops.csv`). See R `ventra.c:5-53` header comment block. |

Interpretation: U is the common upstream for the 14-parser set; R and M each carry one locally-patched
variant. R's ventra is a feature superset; M's smartrider is a reformat/edit.

### 2.5 Provenance of R-unique parsers (path-scoped git log in R)

RogueMaster squashes into dated "Latest RM…on PATREON" commits, so granular authorship is obscured,
but the introducing commit messages are explicit:

- `andalucia.c` → `ca06e4d05` "Latest RM1118-0018-0.420.0-c51dc5c on PATREON - **ADD CTAS ANDALUCIA**"
- `hotels.c` → `ea419796c` "Latest RM1228-2200-0.420.0-d5d7cdf on PATREON - **PR 4323**"
- `trea.c` → `0252da598` "Latest RM0821-0312-0.420.0-3c7c427 on PATREON - **ADD TREA**"

(`git log --oneline -- applications/main/nfc/plugins/supported_cards/<file>` in roguemaster-firmware.)

Provenance of the shared-14 in U (sampled): `saflok.c` and `charliecard.c` last meaningful touch
`647e65cfa "ofw pr 4316 MIFARE Plus 2K Cards in SL1 Mode"` (later reverted `7be5ea8a0`), i.e. these
were already present and merely swept by an unrelated MfPlus PR/revert — they predate it. The shared-14
set originates in U and propagates to R/M by merge/sync.

---

## 3. Car-key NFC parsers — NONE in any fork

Exhaustive search (`grep -rliE 'car.?key|vehicle|tesla|digital key|ccc.?key|automotive|car key'`)
across `applications/` NFC dirs and `lib/nfc` in all four forks returns **no dedicated car-key /
digital-vehicle-key NFC parser** in O, U, R, or M. All apparent matches are false positives:

- `clipper.c` (all forks): "Vehicle id" field of the **Clipper transit card** record format
  (`momentum-firmware/.../supported_cards/clipper.c:425,440,458,493-494`) — transit, not a car key.
- `nfc_cli_dump_common_types.h` (O/U/M): the token is `FelicaCard**Key**` — FeliCa card key, not "car key"
  (`momentum-firmware/applications/main/nfc/cli/commands/dump/protocols/nfc_cli_dump_common_types.h:22`).
- `nfc_test.c` (all forks): unit-test fixture strings.
- `momentum-firmware/applications/external/wav_player/resources/.../CartKeyLock78.wav` etc. — audio
  sample assets in the wav_player demo app (the substring is "Cart Key", a UI sound), unrelated to NFC.

The closest "key/lock" NFC functionality that forks add is **physical-access-lock** parsing, not
automotive: `saflok` (hotel locks, U/R/M) and R's `hotels` (Saflok/VingCard/Onity). These target
hotel-door MIFARE Classic systems via known/derived keys, not vehicle digital keys.

---

## 4. Summary findings

1. **Core stack:** Forks add exactly 3 protocols over official — `emv`, `ntag4xx`, `type_4_tag` —
   **identical set, byte-identical implementation across U/R/M** (md5 SAME on all 30 files).
   Origin = unleashed (`ntag4xx`+`type_4_tag` in U `fa6839d28`; `emv` built incrementally in U).
   R and M inherit verbatim. No fork has a core protocol the others lack.
2. **Parsers:** O=26, U=40, R=43, M=40. U/M ship an identical 14-parser superset over O;
   **R adds 3 R-exclusive parsers** (`andalucia`, `hotels`, `trea`) from Patreon-squashed commits.
3. **Divergence within the shared-14:** only `smartrider` (M-patched) and `ventra` (R-patched, with a
   CTA station database) differ; everything else is md5-identical → U is the parser upstream for both
   R and M.
4. **No car-key / automotive NFC parser exists in any fork.** Forks' added "key/lock" coverage is
   hotel-lock (`saflok`, R's `hotels`) only.
5. **Lineage support:** byte-identical added protocols and 12/14 byte-identical added parsers across
   U→{R,M}, with U holding the original feature-commit history, are consistent with the hypothesized
   official → unleashed → {roguemaster, momentum} lineage for the NFC subsystem.
