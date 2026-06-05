# SubGhz Protocol Inventory & Provenance (cross-fork)

Scope: `lib/subghz/protocols/*.c` in each of the four working trees.
Legend: **O**=official, **U**=unleashed, **R**=roguemaster, **M**=momentum.
All claims verified against checked-out working-tree code; git history queries are path-scoped (partial-clone safe).

Repos / treated tips:
- O = `src/official-firmware` (HEAD `c9ab2b68`)
- U = `src/unleashed-firmware`
- R = `src/roguemaster-firmware`
- M = `src/momentum-firmware`

---

## 1. Presence matrix

`.c` file counts in `lib/subghz/protocols/`: O=56, U=61, R=63, M=98.
(Some files are infrastructure, not registered protocols: `base.c`, `raw.c`, `bin_raw.c`,
`keeloq_common.c`, `protocol_items.c`, and the `aes_common.c` helper.)

### 1a. Core gate/remote protocols (present in official baseline)

All 52 registered protocols common to O are inherited by U/R/M **except three that the forks
DELETED** (see 1c). The shared core (`alutech_at_4n, ansonic, bett, came, came_atomo, came_twee,
chamberlain_code, clemsa, dickert_mahs, doitrand, dooya, faac_slh, feron, gangqi, gate_tx, hay21,
hollarm, holtek, holtek_ht12x, honeywell_wdb, hormann, ido, intertechno_v3, keeloq,
kinggates_stylo_4k, legrand, linear, linear_delta3, magellan, marantec, marantec24, mastercode,
megacode, nero_radio, nero_sketch, nice_flo, nice_flor_s, phoenix_v2, power_smart, princeton,
revers_rb2, roger, secplus_v1, secplus_v2, smc5326, somfy_keytis, somfy_telis`) is **OURM** in all
four and is not re-tabulated here.

### 1b. Non-official protocols / helpers

| file | O | U | R | M | originating fork | TX? |
|---|---|---|---|---|---|---|
| aes_common.c (helper, not a protocol) | . | U | . | M | unleashed | n/a |
| allstar_firefly.c | . | U | R | M | unleashed | **TX** |
| beninca_arc.c | . | U | R | M | unleashed | **TX** |
| ditec_gol4.c | . | U | R | M | unleashed | **TX** |
| elplast.c | . | U | R | M | unleashed | **TX** |
| honeywell.c (alarm sensor) | . | U | R | M | unleashed | **TX** |
| jarolift.c | . | U | R | M | unleashed | **TX** |
| keyfinder.c | . | U | R | M | unleashed | **TX** |
| nord_ice.c | . | U | R | M | unleashed | **TX** |
| treadmill37.c | . | U | R | M | unleashed | **TX** |
| hormann_bisecur.c | . | . | R | M | **roguemaster** | **TX** |
| x10.c | . | . | R | M | **roguemaster** | decode-only |
| telcoma_edge.c | . | . | R | . | **roguemaster (ONLY)** | **TX** |

### 1c. Official-only protocols REMOVED by the forks (OURM = `O...`)

| file | O | U | R | M | note |
|---|---|---|---|---|---|
| kia.c | O | . | . | . | removed in U (and inherited removal by R/M) |
| scher_khan.c | O | . | . | . | removed in U, commit `50b5ee103` "bipki removal procedure" |
| star_line.c | O | . | . | . | removed in U |

Confirmed absent from U/R/M registries: in `unleashed/lib/subghz/protocols/protocol_items.c`,
grep count for `kia`/`scher_khan`/`star_line` = 0 each (vs 1 each in official). File
`unleashed-firmware/lib/subghz/protocols/scher_khan.c` is physically ABSENT.

### 1d. Momentum-only "protocols" = relocated upstream Weather/TPMS/POCSAG decoders (`...M`)

29 files unique to M's `protocols/` dir. These are **not novel gate protocols**; they are the
official Flipper **WeatherStation / TPMS / POCSAG** sensor decoders that Momentum (ex-Xtreme)
*physically moved into* `lib/subghz/protocols/` and namespaced (see Section 4). They are
**commented OUT** of the main SubGhz registry and consumed by external apps instead.

Weather (`ws_protocol_*`): `acurite_592txr, acurite_5n1, acurite_606tx, acurite_609txc, acurite_986,
ambient_weather, auriol_ahfl, auriol_hg0601a, bresser_3ch, emos_e601x, gt_wt_02, gt_wt_03,
infactory, kedsum_th, lacrosse_tx, lacrosse_tx141thbv2, nexus_th, oregon2, oregon3, oregon_v1,
solight_te44, thermopro_tx4, tx_8300, vauno_en8822c, wendox_w6726, ws_generic`.
TPMS: `schrader_gg4, tpms_generic`. Pager: `pocsag`. Generic: `pcsg_generic`.

---

## 2. Provenance & propagation mechanism per non-official protocol

Method: per-repo `git log --oneline -- lib/subghz/protocols/<file>` (path-scoped), plus md5
equality across forks, plus author/subject comparison.

### 2a. The unleashed-origin family (allstar_firefly, beninca_arc, ditec_gol4, elplast, honeywell, jarolift, keyfinder, nord_ice, treadmill37)

These were **authored in Unleashed** (commit subjects like `subghz: add jarolift protocol`
`271c65a96` MX; `subghz add nord ice protocol` `a5f47e3e6` MX; `subghz: add ditec gol4 protocol`
`556a2dd3f` MX; `subghz add keyfinder 24b protocol` `d18619ff5` MX; allstar by jlaughter
`1f2022b87`).

Propagation:
- **U -> M = true git ancestry (merge, NOT manual copy).** The *identical commit SHAs* from
  Unleashed appear in Momentum's path-scoped history (e.g. jarolift `1d32d1de5`, `dfb17ab42`,
  `eb91b7a97` in both U and M; nord_ice `a5f47e3e6` in both). Momentum merges `ul/dev`
  (`d8a644e3e WillyJL Merge remote-tracking branch 'ul/dev'`), so these flow in via merge.
- **U -> R = bulk squashed re-import, NOT per-commit cherry-pick.** In Roguemaster these files'
  history collapses to release-snapshot commits such as `225c6895c RogueMaster "SubGHz lib updates"`,
  `16e0da353 MX "UL CHERRYPICKS"`, and `... on PATREON - UL UPDATES`. Original per-protocol authoring
  SHAs are absent — RM imports Unleashed in periodic batches.

md5 confirms the divergence direction (U is older codepoint, R+M evolved together):
```
allstar_firefly.c  U=467e487d…  R=722d7107…  M=722d7107…   (R==M, U differs)
ditec_gol4.c       U=7e596517…  R=bbd40863…  M=bbd40863…   (R==M, U differs)
elplast.c          U=702512dd…  R=94958e7a…  M=94958e7a…   (R==M, U differs)
honeywell.c        U=413d4447…  R=c9ec181d…  M=c9ec181d…   (R==M, U differs)
jarolift.c         U=20f21074…  R=fd76174a…  M=fd76174a…   (R==M, U differs)
nord_ice.c         U=aabc0e53…  R=537a551d…  M=537a551d…   (R==M, U differs)
treadmill37.c      U=ef32ff77…  R=4196e171…  M=4196e171…   (R==M, U differs)
keyfinder.c        U=R=M=73023d49…                          (all three identical)
beninca_arc.c      U=5445ccea…  R=0d0b35f7…  M=c34d76c1…   (ALL THREE differ — see 2b)
```
R==M on most of these reflects a *common newer Unleashed state* both pulled, not R->M copying;
Momentum's own history shows the same upstream SHAs, so it tracks U directly rather than via R.

### 2b. beninca_arc + aes_common — the AES split (resolves recon ambiguity)

`beninca_arc` is the only U-origin protocol whose `.c` md5 differs in **all three** forks. Root cause:

- **Unleashed & Momentum** decrypt with a **software AES helper**: `aes_common.c` (added together
  with beninca in commit `db2dc8f64 MX "subghz: add beninca arc protocol"` — the *same SHA* is the
  only history entry for `aes_common.c` in BOTH U and M, proving shared ancestry).
  `momentum/lib/subghz/protocols/beninca_arc.c:10` → `#include "aes_common.h"`.
- **Roguemaster** replaced the software path with the **native chip AES peripheral**:
  commit `a2cf8be10 Andrea Santaniello "Native chip AES (… saves some space)"`.
  `roguemaster/lib/subghz/protocols/beninca_arc.c:10` `#include <furi_hal_crypto.h>`, and
  `:185 furi_hal_crypto_aes128_ecb_decrypt(...)`, `:249 furi_hal_crypto_aes128_ecb_encrypt(...)`.

Consequence — **aes_common confirmed map = U + M only, NOT roguemaster.**
`find roguemaster-firmware -name 'aes_common*'` → no results; `rg aes_common roguemaster-firmware/lib/subghz` → no references. RM dropped the helper precisely because it switched beninca_arc to hardware AES.

### 2c. roguemaster-origin protocols (telcoma_edge, x10, hormann_bisecur)

- **telcoma_edge.c — ROGUEMASTER-ONLY (confirmed).** Present only in R; absent from O/U/M trees.
  Authored in R: `529fdbad3 Benjamin Tamasi "SubGhz: add Telcoma/Cardin EDGE protocol"`, later
  `149d92ed5 RogueMaster "… - UPD telcoma proto"`. md5 `610fca268993927878445434579ea558`. 356 LOC,
  TX-capable.
- **x10.c — R-origin -> propagated to M.** Authored in R:
  `889674048 RogueMaster "Add Rock Paper Scissors & X10 Protocol (Decoder Only)"`, then refined by
  Willy-JL. R and M md5 are identical (`b138402d8d984782b370009456d2e83a`); M history carries the
  shared Willy-JL/Xtreme commits (`ab86ef8b4`, `02ec1f086`). Cross-flow R<->Xtreme(M) via shared
  contributor (Willy-JL) and PR merges (`608d2b1d9 WillyJL Merge pull request #119` appears in R's
  x10 history).
- **hormann_bisecur.c — user890104 (Vencislav Atanasov) -> both R and M.** R and M md5 identical
  (`3a469b746a02687d1d24dfac4222a906`). R history shows `608d2b1d9 WillyJL Merge pull request #119
  from user890104/subghz-protocol-hormann-bisecur`; M history shows the original per-commit authoring
  by Vencislav Atanasov (`45999b441 "Add new SubGHz protocol: Hormann BiSecur (#118)"`, plus
  `e0a427f28`, `d780c55ec`, `3d412d366`). Same upstream PR (user890104) landed in both via merge.

---

## 3. Decode vs encode/TX capability

Determined from each protocol's `const SubGhzProtocol …` struct: a non-NULL `.encoder` field **and**
the user-facing `SubGhzProtocolFlag_Send` bit. (`.encoder` present without `_Send` = encoder code
exists but TX is not exposed = effectively decode-only.)

| protocol | `.encoder` set | `_Send` flag | effective capability |
|---|---|---|---|
| allstar_firefly | yes | yes | encode + decode (TX) |
| beninca_arc | yes | yes | encode + decode (TX) |
| ditec_gol4 | yes | yes | encode + decode (TX) |
| elplast | yes | yes | encode + decode (TX) |
| honeywell (alarm) | yes | yes | encode + decode (TX) |
| jarolift | yes | yes | encode + decode (TX) |
| keyfinder | yes | yes | encode + decode (TX) |
| nord_ice | yes | yes | encode + decode (TX) |
| treadmill37 | yes | yes | encode + decode (TX) |
| hormann_bisecur | yes | yes | encode + decode (TX) |
| telcoma_edge | yes | yes | encode + decode (TX) |
| **x10** | yes | **no** | **decode-only** (encoder present but `_Send` omitted; `roguemaster/lib/subghz/protocols/x10.c:90-95` flag = `_315 \| _AM \| _Decodable`, no `_Send`) |

Weather/TPMS family (momentum): all have a `.encoder` struct, but **only the TX-meaningful station
emulators carry `_Send`** — `nexus_th` and `acurite_592txr` have `_Send` (TX-capable station spoofing);
the remaining sensors (`acurite_5n1/606tx/609txc/986, oregon2/3/v1, lacrosse*, bresser_3ch, gt_wt_*,
kedsum_th, infactory, auriol_*, emos_e601x, solight_te44, thermopro_tx4, tx_8300, vauno_en8822c,
wendox_w6726, ambient_weather, ws_generic`) and the TPMS/pager decoders (`schrader_gg4, tpms_generic,
pocsag, pcsg_generic`) are **decode-only**.

---

## 4. Architectural note: Momentum's weather/TPMS files are vendored, not registered

The 29 M-only files are **not active in the main SubGhz protocol registry**. In
`momentum/lib/subghz/protocols/protocol_items.c` every `ws_protocol_*` / `tpms_*` entry is
**commented out** (e.g. `// &ws_protocol_oregon2,`, `// &lnschrader_gg4,`). They are instead compiled
into and registered by **external apps**:
- TPMS reader: `momentum/applications/external/tpms_reader/protocols/protocol_items.c`
  (`lnregistry_items[] = { &lnschrader_gg4, … }`).
- A weather-station app consumes the `ws_protocol_*` set similarly.

The odd `ln` / `lnregistry` / `lnschrader_gg4` symbol names come from app-local `#define`
namespacing (the upstream `subghz_protocol_registry`/`ws_protocol_*` symbols are macro-aliased so the
vendored copies don't collide with the firmware's own). This is a **manual vendoring/relocation**, not
a new protocol family.

Origin of these decoders is **upstream OFFICIAL**, in `applications/` not `lib/`:
- `oregon2.c` earliest history: `d003db040 Max Lapan "SubGhz: Oregon v2.1 decoder (#1678)"` (2022-09-19),
  pulled in via `9a9abd59e Skorpionm "WS: add app WeatherStation (#1833)"` (2022-10-19).
- TPMS/pocsag integration into the protocols dir: `b9382c912 HTotoo "WIP integrate weather, tpms and
  pocsag to SubGhz app"` (2023-09-20).
- `ambient_weather.c` is the only genuinely new decoder here, authored by HTotoo (`b9382c912`, 2023-09-20)
  — momentum/HTotoo-original.

Roguemaster ONCE carried these weather files too but **removed them**: e.g.
`roguemaster … oregon2.c` history ends at `3319a52a9 "… - Remove Dupe Protocols"`. They are absent
from R's current tree (`ls roguemaster/lib/subghz/protocols | grep -E 'oregon|acurite|nexus' → none`).

---

## 5. Single-fork protocols (definitive list)

- **Roguemaster-only:** `telcoma_edge.c` (confirmed — only R has it).
- **Momentum-only:** the 29 relocated weather/TPMS/POCSAG decoder files listed in §1d, of which
  `ambient_weather.c` is the only one authored uniquely for this fork; the rest are vendored copies
  of upstream/official WeatherStation+TPMS decoders that no other fork keeps under `protocols/`.
- **Official-only (and DELETED downstream):** `kia.c`, `scher_khan.c`, `star_line.c`.
- **Roguemaster + Momentum (not unleashed):** `hormann_bisecur.c`, `x10.c`.
- **Unleashed + Momentum (not roguemaster):** `aes_common.c` (helper).

---

## 6. Confidence

- Presence matrix, single-fork lists, official-only deletions: **certain** (direct filesystem +
  registry grep).
- aes_common = U+M only, RM uses native chip AES: **certain** (file absence + `furi_hal_crypto` calls
  cited at `roguemaster/…/beninca_arc.c:185,249`).
- telcoma_edge roguemaster-only: **certain**.
- Propagation mechanism (U->M merge with shared SHAs; U->R squashed bulk import): **high** — based on
  matching/absent commit SHAs in path-scoped history and RM's squashed release-snapshot subjects.
- Weather/TPMS being vendored-from-official rather than fork-original: **high** (history traces to
  official #1678/#1833; only `ambient_weather` is fork-new).
