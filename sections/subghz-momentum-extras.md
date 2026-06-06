# Momentum-only SubGhz additions — Weather / TPMS / Pager pack

Scope: confirm which of the requested protocols exist **only in Momentum's core
SubGhz library** (`lib/subghz/protocols/`) vs also in Unleashed (U) /
RogueMaster (R); determine **origin/provenance**; assess **sensitivity** of the
TPMS and POCSAG capabilities.

All paths below are relative to each fork root under
`{official,unleashed,roguemaster,momentum}-firmware`.

---

## 1. Headline finding (with a critical nuance)

The requested protocols exist as **core-library source files**
(`lib/subghz/protocols/*.c`) **only in Momentum** — confirmed absent from the
core lib of official, Unleashed, and RogueMaster.

**BUT** the same protocol *family* is NOT Momentum-exclusive as software:

- **RogueMaster** ships these protocols as **bundled external FAP apps**
  (`applications/external/weather_station/`, `.../tpms/`, `.../pocsag_pager/`,
  `.../protoview/`) — each app carries its **own private copy** of the protocol
  `.c` files.
- **Unleashed** ships **none** of them in-repo (its `applications/external/` is
  effectively empty for these; U pulls such apps from the online apps catalog at
  runtime).
- **Momentum** is the only fork that **integrates the protocols into the core
  SubGhz library** (with TX/encoder support + a protocol-filter subsystem), AND
  *also* bundles the external apps (`weather_station`, `tpms_reader`,
  `pocsag_pager`, `protoview`, `flip_weather`, `meal_pager`).

So the accurate claim is: **core-lib integration of the weather/TPMS/pager pack
is Momentum-unique; the protocols themselves are shared community code that R
also bundles (as apps) and U fetches from the catalog.**

### Per-protocol presence (core lib `lib/subghz/protocols/`)

| Requested protocol | official | Unleashed | RogueMaster | Momentum (core lib) |
|---|---|---|---|---|
| acurite_592txr / 5n1 / 606tx / 609txc / 986 | – | – | – | ✅ (5 files) |
| oregon2 / oregon3 / oregon_v1 | – | – | – | ✅ (3) |
| lacrosse_tx / lacrosse_tx141thbv2 | – | – | – | ✅ (2) |
| ambient_weather | – | – | – | ✅ |
| auriol_ahfl / auriol_hg0601a | – | – | – | ✅ (2) |
| bresser_3ch | – | – | – | ✅ |
| emos_e601x | – | – | – | ✅ |
| gt_wt_02 / gt_wt_03 | – | – | – | ✅ (2) |
| infactory | – | – | – | ✅ |
| kedsum_th | – | – | – | ✅ |
| nexus_th | – | – | – | ✅ |
| solight_te44 | – | – | – | ✅ |
| thermopro_tx4 | – | – | – | ✅ |
| vauno_en8822c | – | – | – | ✅ |
| wendox_w6726 | – | – | – | ✅ |
| ws_generic (shared weather base) | – | – | – | ✅ |
| schrader_gg4 (TPMS) | – | – | – | ✅ |
| tpms_generic (TPMS base) | – | – | – | ✅ |
| pocsag (pager) | – | – | – | ✅ |
| pcsg_generic (pager base) | – | – | – | ✅ |
| tx_8300 | – | – | – | ✅ |

Total: **30 `.c` files** make up the Momentum core-lib pack (the 21 requested
families plus shared bases `ws_generic`, `tpms_generic`, `pcsg_generic`, and
extra weather members `bl999` etc.).

Method/citations: directory listings of all four `lib/subghz/protocols/`
folders; repo-wide `rg` for `acurite_592txr|lacrosse_tx141|oregon3|schrader|
pocsag` finds them in R only under `applications/external/...`, in M under both
`lib/subghz/protocols/` and `applications/external/...`, and **not at all** in U.

### Filter subsystem — partial leak into RogueMaster

Momentum added a `SubGhzProtocolFilter` enum + a `.filter` field on the protocol
struct to gate Weather/TPMS protocols:

- `momentum-firmware/lib/subghz/types.h:140-157` defines
  `SubGhzProtocolFilter_{ReversRB2,Alarms,Sensors,Princeton,NiceFlorS,Weather,TPMS}`
  and adds `SubGhzProtocolFilter filter;` to the protocol struct.
- Each weather/TPMS core file sets it, e.g.
  `lib/subghz/protocols/acurite_592txr.c:97` `.filter = SubGhzProtocolFilter_Weather`,
  `lib/subghz/protocols/schrader_gg4.c:111` `.filter = SubGhzProtocolFilter_TPMS`.

**RogueMaster copied the enum + struct field but not the protocols.**
`roguemaster-firmware/lib/subghz/types.h:140-157` contains the identical enum,
but **no `.c` in R's `lib/subghz/` references `SubGhzProtocolFilter_Weather/TPMS`**
→ it is **vestigial** in R, introduced by R commit `d6a7bb66c3` *"Latest Release
RM0210-1603-0.97.2-2707a31 on PATREON - SUBG OVERHAUL PT1"* (R pulled Momentum's
"SubGhz overhaul" header changes without the accompanying protocol bodies).
**Unleashed lacks the filter mechanism entirely** (no `SubGhzProtocolFilter` in
`unleashed-firmware/lib/subghz/types.h`, no `.filter` field).

### Registry nuance — present but commented out of the default scanner

The protocols are compiled into Momentum's core lib but their entries in the
**main** `subghz_protocol_registry` are **commented out**:
`momentum-firmware/lib/subghz/protocols/protocol_items.c:43-69, 72-73`
(`// &ws_protocol_acurite_592txr,` … `// &subghz_protocol_pocsag,` …
`// &tpms_protocol_schrader_gg4,`). They are actively registered instead by the
**external apps'** own registries, e.g.
`momentum-firmware/applications/external/weather_station/protocols/protocol_items.c:4-16`.
Net effect: the default SubGhz Read app does not scan weather/TPMS/pager by
default; the dedicated apps (which link the core-lib symbols) do.

---

## 2. Origin / provenance

**None of this is original to Momentum.** Two upstream sources:

### (a) Weather + TPMS decoders → ported from rtl_433 via the Flipper weather_station app

- **24 of the core files carry explicit attribution to rtl_433**
  (`github.com/merbanan/rtl_433`). Examples:
  - `lib/subghz/protocols/acurite_592txr.c:5-7` — links
    `merbanan/rtl_433/.../acurite.c`, copies the exact bit-field message table.
  - `lib/subghz/protocols/schrader_gg4.c:6-9` — links
    `merbanan/rtl_433/.../schraeder.c`, plus a DLR TPMS research PDF, a
    portapack-havoc issue, and FCC IDs `MRXGG4`/`MRXGG4T`.
  - `oregon2.c`, `lacrosse_tx*.c`, `ambient_weather.c`, etc. all use the
    `WSProtocol*` naming and shared `ws_generic.h` base of the Flipper
    weather_station app.
- The naming (`ws_protocol_*`, `WSProtocol*`) and the `htotoo.github.io`
  SUB-generator URL embedded in comments (`acurite_592txr.c:28`) tie these to
  the community Flipper **weather_station** app maintained by **HTotoo**.

### (b) POCSAG pager → the community Flipper pager app by Max Lapan

- `lib/subghz/protocols/pocsag.c` is the standard Flipper POCSAG decoder. Its
  earliest commits in Momentum's history are authored by **Max Lapan**
  (the original author of the flipper POCSAG/pager app):
  `4c092c8e6 | Max Lapan | 2022-11-19 | "Basic sync"`,
  `0bc197baa … "Message structure"`, etc. No rtl_433 link (POCSAG is a pager
  protocol, not an rtl_433 sensor). Later maintenance by Willy-JL / MX (Momentum
  maintainers).

### Provenance via path-scoped git log (Momentum)

| File (core lib) | First/registering commit | Author | Date |
|---|---|---|---|
| `lib/subghz/protocols/acurite_592txr.c` | `b9382c912` "WIP integrate weather, tpms and pocsag to SubGhz app" | **HTotoo** `<ttotoo@gmail.com>` | 2023-09-20 |
| `lib/subghz/protocols/schrader_gg4.c` | `b9382c912` (then `7eaf213bc` "TPMS Load / Save") | HTotoo | 2023-09-20 |
| `lib/subghz/protocols/tpms_generic.c` | `b9382c912` | HTotoo | 2023-09-20 |
| `lib/subghz/protocols/ws_generic.c` | `b9382c912` | HTotoo | 2023-09-20 |
| `lib/subghz/protocols/pocsag.c` | `4c092c8e6` "Basic sync" (origin) | **Max Lapan** | 2022-11-19 |

- **`b9382c912`** ("WIP integrate weather, tpms and pocsag to SubGhz app", by
  **HTotoo**, **2023-09-20**) is the single core-integration commit; it touches
  **48 files** under `lib/subghz/protocols/`. Date (Sep 2023) places it in the
  **Xtreme era** (Momentum was renamed from Xtreme later in 2023), consistent
  with the lineage hypothesis (Momentum = ex-Xtreme).
- The Momentum-specific value-add on top of the ported decoders: **adding
  encoders/TX** (the core-lib `acurite_592txr.c` wires up
  `..._encoder_alloc/free/deserialize/stop/yield` and sets
  `SubGhzProtocolFlag_Send`, whereas the app copy leaves them `NULL` /
  decode-only), the **filter subsystem**, and **Load/Save** to `.sub`
  (`7eaf213bc` "TPMS Load / Save").

### Cross-fork content comparison (shared origin, manual copies)

`md5 -q` shows the core-lib and app copies are **edited variants** of one
codebase, not independent rewrites:

- `acurite_592txr.c`: M core-lib `97f1320…` vs M app `29358c7…` vs R app
  `1fdaa04…`. A normalized diff (strip `#include`) of M core-lib vs M app shows
  only: core adds an **encoder** + `SubGhzProtocolFilter_Weather` + 32-bit hash
  API + `SubGhzProtocolFlag_Send/Save/Load`; the app stays decode-only
  (`SubGhzProtocolWeatherStation`, `get_hash_data` 8-bit). Same body otherwise →
  shared origin.
- `schrader_gg4.c`: M core-lib `ebf0dfc…` vs M tpms app `875e8c4…` vs R tpms app
  `6697dc0…` — three drifted copies of one decoder.
- `pocsag.c`: M core-lib `cd91e73…`; M app `19dc30e…`; R app `1c1be63…`.

---

## 3. Sensitivity assessment

### TPMS (`schrader_gg4`, `tpms_generic`) — vehicle privacy / tracking

What it enables: **receive-decode** of automotive Tire-Pressure-Monitoring-System
transmissions at 433 MHz. The decoder extracts and stores the **per-sensor ID**
plus live pressure/temperature:

- `lib/subghz/protocols/schrader_gg4.c:152` `instance->id = instance->data >> 24;`
  (sensor ID), `:157-158` temperature/pressure extraction; OEM cross-refs in the
  header (`schrader_gg4.c:21-31`) name Kia Sportage / Mercedes-Benz part numbers.
- `lib/subghz/protocols/tpms_generic.c:17-66` serializes `Id`, `Battery_low`,
  `Pressure`, `Temperature` to a saved record.

Privacy angle: each TPMS sensor emits a **stable unique ID**. A passive receiver
can fingerprint and **re-identify / track a specific vehicle** as it passes a
fixed listening point — a well-documented TPMS surveillance vector (the header
even cites the DLR *"TPMS for Traffic Management purposes"* paper,
`schrader_gg4.c:7`). The code is **receive/decode + log** (and, in the core-lib
variant, replay/TX via the added encoder). It does **not** crack any crypto —
TPMS frames are unauthenticated/plaintext by design. Confidence: this is a
**genuine privacy/tracking capability**, but it is standard community
functionality also present (as apps) in RogueMaster and the public apps catalog;
nothing Momentum-specific or covert.

### POCSAG (`pocsag`, `pcsg_generic`) — pager message interception

What it enables: decode of **POCSAG pager transmissions**, including the
**message text/content**, not just addresses:

- `lib/subghz/protocols/pocsag.c:36` `func_msg[] = {"\e#Num:\e# ", "\e#Alert\e#",
  "\e#Alert:\e# ", "\e#Msg:\e# "}` and `:37` `bcd_chars`, with per-character
  decode state (`:49-53,109-110`) → reconstructs numeric and **alphanumeric
  pager messages** addressed to any capability code on the listened frequency.

Sensitivity: POCSAG is unencrypted; decoding third-party pager traffic
(hospitals, emergency services, industrial paging) is an **intercept-of-content**
capability and is illegal to do to traffic not addressed to you in many
jurisdictions. Again this is **passive receive**, is mainstream community code
(Max Lapan's pager app, also bundled by RogueMaster and in the catalog), and is
not hidden or auto-running. Confidence: real interception capability, **not
malicious or covert** — it is opt-in via a user-launched app.

### Weather sensors (acurite/oregon/lacrosse/…)

Low sensitivity — decode of consumer temperature/humidity/rain sensors. Stable
sensor IDs give a weak proximity-fingerprint of a household sensor but no
personal/security data. rtl_433-equivalent functionality.

---

## 4. Bottom line

- **Core-lib SubGhz integration of the weather/TPMS/pager pack (30 files) is
  Momentum-unique** among the four forks (absent from official/U/R core lib).
- The **protocols are not original to Momentum**: weather + TPMS decoders are
  **ports of rtl_433** (24 files cite `merbanan/rtl_433`) brought in via the
  community **weather_station** app (HTotoo); POCSAG is **Max Lapan's** pager
  app. Momentum's added value is **encoders/TX, Load/Save, and a Weather/TPMS
  filter subsystem**, landed in one Xtreme-era commit `b9382c912` (HTotoo,
  2023-09-20).
- The same protocols are **bundled as external FAP apps by RogueMaster** and are
  **catalog-fetched (not in-repo) by Unleashed** — so as *features* they are not
  Momentum-exclusive; only the *core-library merge* is.
- **RogueMaster vestigially copied Momentum's `SubGhzProtocolFilter` enum**
  (`types.h:140-157`, via R commit `d6a7bb66c3`) without the protocol bodies.
- **Sensitivity:** TPMS = real vehicle re-identification/tracking vector
  (stable sensor IDs + the cited surveillance research); POCSAG = real pager
  message-content interception. Both are **passive, user-launched, mainstream
  community capabilities — not covert and not Momentum-introduced abuse.**
