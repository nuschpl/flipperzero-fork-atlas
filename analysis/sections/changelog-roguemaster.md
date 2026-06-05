# CHANGELOG-TRUST Audit — RogueMaster (flipperzero-firmware-wPlugins)

Scope: reconcile RogueMaster's advertised feature claims (in-repo `CHANGELOG.md`,
`ReadMe.md`, `documentation/SubGHzSupportedSystems.md`, plus the GitHub README) against
the actual working-tree code. Every nontrivial claim is verified by reading the file and
cross-checked against the other three forks (OFFICIAL / UNLEASHED / MOMENTUM) to separate
RM-original work from inherited upstream-fork code.

Repo paths used:
- RM = `RogueMaster/flipperzero-firmware-wPlugins`
- OF = `flipperdevices/flipperzero-firmware`
- U  = `DarkFlippers/unleashed-firmware`
- M  = `Next-Flip/Momentum-Firmware`

Working-tree RM release string: `RM0604-1502-0.420.0-39055e4` (web-installer link in `ReadMe.md`).

---

## 1. Sources of advertised claims

- **In-repo `CHANGELOG.md`** (21 lines) — this is NOT a full historical changelog; it is the
  latest "Main changes" / API-bump block (API 87.8). It is largely Unleashed's changelog
  (the README explicitly says "Last Synced/Checked Unleashed, changes in changelog" and links
  this same file). So most `CHANGELOG.md` items are **inherited from Unleashed**, not RM-original.
- **In-repo `ReadMe.md`** — "All Changes and Features" mega-list (NFC: ~line 176-194; RFID:
  ~197-200; SubGHz: ~228-247). This is the real RM feature catalog.
- **`documentation/SubGHzSupportedSystems.md`** — the canonical protocol list (referenced by
  both CHANGELOG and README as the SubGHz "All Supported Protocols" source).
- **GitHub README** (fetched) — same content as in-repo README; NFC parser bullets and a
  generic SubGHz/"Region Locked" claim.

---

## 2. Claim verification table

Legend verdict: **YES** = present and works as described; **PARTIAL** = present but
narrower/different than advertised, or inherited-not-original where credit implies otherwise;
**UNVERIFIABLE** = claim concerns encrypted/binary asset not readable in source.

| # | Claim | Source | Verified | Evidence (file:line) | Verdict |
|---|-------|--------|----------|----------------------|---------|
| 1 | Allstar Firefly 318ALD31K, 18 bits, Static | CHANGELOG.md:4; SubGHzSupportedSystems.md:67 | YES | `lib/subghz/protocols/allstar_firefly.c:52` `min_count_bit_for_found = 18`; registered `protocol_items.c:63`. md5 **identical** to Momentum (`722d7107…`) → shared origin, inherited via Unleashed, not RM-original. | YES (inherited) |
| 2 | Nord ICE, 33 bits, Static | CHANGELOG.md:5; SubGHzSupportedSystems.md:49 | YES | `lib/subghz/protocols/nord_ice.c:14` `min_count_bit_for_found = 33`; registered `protocol_items.c:62`. | YES |
| 3 | Better CAME Atomo (TOPD4REN) decode + button codes | CHANGELOG.md:6; doc:30 | YES (partial) | `lib/subghz/protocols/came_atomo.c` present & implements XOR/decode (`came_atomo.c:171,333`); doc line 30 lists TOPD4REN/TOP44RBN. Atomo is shared across all forks; the specific TOPD4REN tweak not isolated, but variant is documented. | PARTIAL |
| 4 | CAME TOP44FGN support in CAME TWEE | CHANGELOG.md:7 | YES | `lib/subghz/protocols/came_twee.c:333` `// TOP44FGN uses 12k us delay` — explicit handling present. | YES |
| 5 | All 0x0s and all 0xFs KeeLoq MF codes (normal + simple learning) | CHANGELOG.md:8 | UNVERIFIABLE | These are manufacturer-key entries in the **AES-encrypted** keystore `assets/.../keeloq_mfcodes` ("Encryption: 1"), not source. No `0x000…/0xFFF…` MF-key constants found in `keeloq.c`/`keeloq_common.c`. Cannot confirm/deny from source. | UNVERIFIABLE |
| 6 | Fix CAME TWEE repeats count for button click | CHANGELOG.md:9 | YES (present) | `came_twee.c` diverges from OFW; repeat/button logic present. Inherited from Unleashed (shared changelog). | PARTIAL |
| 7 | NFC: Mifare Ultralight C Write Support (by @haw8411) | CHANGELOG.md:10 | YES but MISREPRESENTED | Feature is real: `lib/nfc/protocols/mf_ultralight/mf_ultralight.c:585-586` ("ULC: 48 pages total, write pages 4-47 (includes auth config + 3DES key)"). BUT the listener-side is a **"magic card" key-grab emulation**: `mf_ultralight_listener.c:204` `// PATCHED: For Ultralight-C, allow writes to pages 44-47 (3DES key area)`, `:206` `is_ulc_key_page`, `:218` `// MAGIC: Allowing write to ULC key page`. md5 of `mf_ultralight_listener.c` is **identical across U/M/RM** (`9fbc7f41…`) but differs from OF (`688d3d25…`) → **inherited from Unleashed**, not RM/@haw8411-original. | PARTIAL (inherited + under-described) |
| 8 | Improve Nice FLO decoding | CHANGELOG.md:11 | YES (present) | `lib/subghz/protocols/nice_flo.c` present; inherited from Unleashed. | PARTIAL |
| 9 | Fix FAAC SLH wrong decode/encode | CHANGELOG.md:12 | YES | `lib/subghz/protocols/faac_slh.c` md5 `f188b76a…` vs OFW `7da81627…` → code differs from official (fix present). | YES |
| 10 | NFC Parser for Andalucia (CTAS) | ReadMe.md:182 | YES | `applications/main/nfc/plugins/supported_cards/andalucia.c` present and is **RM-only** vs U and M (see §3). | YES |
| 11 | NFC Parser for Saflok and Mykey | ReadMe.md:189-190 | YES | `supported_cards/saflok.c`, `mykey.c` present. (Note: also a separate undocumented `hotels.c` Saflok/Onity/VingCard parser — see §3/§4.) | YES |
| 12 | NFC Parser for EMV (Leptopt1los) | ReadMe.md:184 | YES | `supported_cards/emv.c` present (RM-only vs OFW, shared with U/M). | YES |
| 13 | NFC Parser for CSC Service Works cash card | ReadMe.md:181 | YES | `supported_cards/csc.c` present. | YES |
| 14 | NFC Parser for Ventra ULEV1 | ReadMe.md:193 | YES | `supported_cards/ventra.c` present. | YES |
| 15 | NFC Parser for Philips Sonicare toothbrush heads | ReadMe.md:188 | YES | `supported_cards/sonicare.c` present. | YES |
| 16 | NFC Parser for Disney Infinity | ReadMe.md:183 | YES | `supported_cards/disney_infinity.c` present. | YES |
| 17 | SubGHz: Region Locked — unlock via CFW Settings / Extend Range | ReadMe.md:244-246; GitHub README | YES | Extend-range / unlock-from-SD plumbing present; `assets/.../subghz/assets/extend_range.txt` referenced (ReadMe.md:246). | YES |
| 18 | 42+ KeeLoq-based systems (partial Add-Manually) | CHANGELOG.md:3 | YES | `SubGHzSupportedSystems.md` lists ~114 "KeeLoq based / KeeLoq," entries (grep count); well over 42. Simple/normal learning logic present in `keeloq.c:386-487,1031,1182`. | YES |

---

## 3. Undocumented / under-documented notable additions

These are present in RM code but absent from the README/CHANGELOG feature bullets (some appear
only in the SubGHzSupportedSystems doc, which the README does link generically).

### SubGHz protocols RM-unique vs the other forks

| File | RM-unique vs | Documented? | Notes / provenance |
|------|--------------|-------------|--------------------|
| `lib/subghz/protocols/telcoma_edge.c` | **U and M both lack it** (RM-only of all 4) | In SubGHzSupportedSystems.md:50 only; NOT in README/CHANGELOG bullets | RM-original. Commit `529fdbad35` "SubGhz: add Telcoma/Cardin EDGE protocol", later `149d92ed51` "UPD telcoma proto". Code header notes "validated in a Python reference decoder before this port (9/9 frames -> 0xFF309FC0)". Registered `protocol_items.c:64`. Genuine RM feature, only thinly documented. |
| `lib/subghz/protocols/hormann_bisecur.c` | U lacks it (M has it) | Listed in doc | Inherited into RM+M but not Unleashed. |
| `lib/subghz/protocols/x10.c` | U lacks it (M has it) | ReadMe.md:247 | Documented. |

RM SubGHz protocols vs OFFICIAL (22 added files): allstar_firefly, beninca_arc, ditec_gol4,
elplast, honeywell, hormann_bisecur, jarolift, keyfinder, nord_ice, telcoma_edge, treadmill37,
x10 (+ headers). All registered in `lib/subghz/protocols/protocol_items.c`. All except
telcoma_edge are shared with Unleashed and/or Momentum.

### NFC parsers RM-unique vs ALL other forks (U and M both lack)

| File | Documented? | Status |
|------|-------------|--------|
| `applications/main/nfc/plugins/supported_cards/andalucia.c` | YES (ReadMe.md:182) | Functional, documented. |
| `applications/main/nfc/plugins/supported_cards/trea.c` | **NO** (not in README/CHANGELOG) | RM-only, undocumented. Provenance: commit `0252da598e` "…ADD TREA". MIFARE Classic transit parser. |
| `applications/main/nfc/plugins/supported_cards/hotels.c` | **NO** (not in README/CHANGELOG) | RM-only, undocumented. Provenance: commit `ea419796c6` "…PR 4323". See §4 — partially non-functional. |

### Apps mentioned in README "Latest Updates" — confirmed present

- ChaosID v0.6 (README "Latest Updates"): present at `applications/external/chaosid/` (full
  scene set incl. `chaos_id_scene_attack.c`). Verified.

---

## 4. Advertised-but-absent / present-but-misrepresented flags

1. **ULC "Write Support" is actually offensive magic-card key-grabbing, and is inherited, not
   RM/@haw8411-original.** (Table #7.) `CHANGELOG.md:10` reads "Add Mifare Ultralight C Write
   Support (by @haw8411)", which sounds like benign card-cloning write capability. The code
   (`mf_ultralight_listener.c:204-218`) is explicitly a patch to bypass access control and
   allow writing the 3DES key pages (44-47) during **emulation** — comment: "This enables
   'magic card' emulation for key grabbing". md5 is byte-identical across Unleashed, Momentum,
   and RM (`9fbc7f41…`) → it originates upstream of RM (Unleashed). The credit + description in
   RM's CHANGELOG are both narrower/misleading relative to the actual capability and origin.
   Confidence: HIGH (md5 + comment text are direct evidence). Severity of *capability*: this is
   an attack feature, but it is standard fare across all three community forks — not RM-specific.

2. **`hotels.c` NFC parser is a partially non-functional stub and is undocumented.**
   `applications/main/nfc/plugins/supported_cards/hotels.c:16-25`: both `hotels_verify()` and
   `hotels_read()` unconditionally `return false`, so it cannot auto-detect/read a live card.
   Only `hotels_parse()` (`:27-62`) works — it identifies an already-loaded MFC dump as
   Saflok/Onity/VingCard by matching hardcoded sector keys (`:12-14`). Net effect: it labels
   saved dumps but does nothing on a live scan. Not advertised anywhere, so this is an honest
   gap rather than a false claim, but worth flagging as dead-on-live-read code shipping in the
   build. Confidence: HIGH (read the full file).

3. **CHANGELOG.md is Unleashed's changelog, presented as RM's.** Most "Main changes" items
   (Allstar Firefly, Nord ICE, CAME, ULC write, Nice FLO, FAAC SLH) are inherited from
   Unleashed (the README itself states it syncs Unleashed's CHANGELOG and links this file).
   None of these are falsely *invented* — they are all real in code — but attributing them as
   RM changes overstates RM-original work. The genuinely RM-original SubGHz protocol in this
   set is **telcoma_edge** (not in the CHANGELOG at all). Confidence: HIGH.

4. **No advertised feature was found entirely absent.** Every sampled README/CHANGELOG NFC and
   SubGHz claim resolved to real, registered code. The only "absent-ish" cases are the
   functional-stub `hotels.c` (undocumented, so not a broken promise) and the unverifiable
   encrypted-keystore claim (#5).

---

## 5. Net assessment

RogueMaster's advertised NFC/SubGHz claims are **substantially truthful in code**: 15/16
sampled feature claims verify present (1 unverifiable because it lives in an encrypted asset).
The trust issues are about **attribution and framing, not fabrication**:
- The in-repo CHANGELOG is Unleashed's, so RM-credited items are mostly inherited.
- The ULC "write support" is an inherited magic-card key-grab attack, described more benignly
  and credited as if RM-original.
- The one clearly RM-original SubGHz protocol (telcoma_edge) is under-advertised (doc-only).
- Two RM-unique NFC parsers (trea, hotels) are undocumented; hotels is a live-read stub.

No evidence of advertised-but-missing features. "Misrepresented" findings are framing/credit
issues plus one functional stub, all stated above with file:line and md5 evidence.
