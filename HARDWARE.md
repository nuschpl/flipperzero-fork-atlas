# Hardware ↔ firmware map

What the silicon is (per the official [tech specs](https://docs.flipper.net/zero/development/hardware/tech-specs))
and where each part shows up in this analysis. The atlas studies the **firmware**;
this page ties it back to the **hardware** it drives.

## The chips

| Hardware (tech specs) | What it is | Where it appears in the atlas |
|---|---|---|
| **STM32WB55RG** — dual core: **Cortex-M4 @64 MHz (application)** + **Cortex-M0+ @32 MHz (radio)**; 1024 KB flash + 256 KB SRAM (shared) | Main MCU. The M4 runs the firmware you flash; the M0+ runs the BLE/802.15.4 stack **and FUS**, which manages the **Customer Key Storage (CKS)** = the "secure enclave." | The reflashable firmware itself + the **secure enclave** (slot-1 Keeloq-keystore key, slot-2 U2F). See `SECURITY.md → Secure enclave (CKS)`; nodes `rc-kq-keys`, `nf-ulc`. Hardware `AES1` block does Crypto1/AES math. |
| **CC1101** — sub-1 GHz transceiver; 315/433/868/915 MHz (region-dependent); OOK + (G)FSK; 20 dBm | Sub-GHz radio. | Entire **SubGhz** domain → node `rad-cc1101`. Modulations (`mod-ook`, `mod-2fsk`…), presets (`pre-am650`…), every gate/rolling-code protocol, and the **region-lock / extended-range / TX-power** findings (the "region-dependent" bands are exactly what Unleashed strips and R/M make user-bypassable). |
| **ST25R3916** — NFC transceiver; 13.56 MHz; ISO 14443A/B, MIFARE, FeliCa | NFC analog frontend. | Entire **NFC** domain → node `rad-st25r`. RF layers (`lay-14443a/b`, `lay-14443-4`, `lay-15693`, `lay-felica`), **Crypto1** (MIFARE Classic), the mfkey / dictionary / magic-card features. |
| **Bluetooth LE 5.4** (4 dBm) | Runs on the **M0+ radio core** (same core as FUS). | The **BadBT pairing-PIN suppression** finding (`se-blepin`). Also why enclave key ops are wrapped in `furi_hal_bt_lock_core2()` — the `FUS_LoadUsrKey` call goes through this core. |
| **MicroSD** (SPI, up to 256 GB) | Removable storage. | Holds the **encrypted `keeloq_mfcodes` keystore** and the plaintext **MIFARE dictionaries** (`at-dict`). Note the split: the *encrypted blob* lives on the removable SD; the *key to decrypt it* lives in the MCU enclave. |
| **125 kHz RFID** (EM4100 / HID / Indala; AM/OOK) | LF RFID subsystem. | Out of the NFC/SubGhz focus; forks add an LFRFID fuzzer (not deep-dived here). |
| **Infrared** (RX 38 kHz / TX 940 nm), **iButton** (1-Wire: Dallas/Cyfral/Metakom), **GPIO** (13 I/O, 3V3, 5V-tolerant) | Other subsystems. | Not in scope (atlas focuses on NFC + SubGhz). |
| **Battery** 2100 mAh LiPo | Power. | n/a |

## The one that matters for the Keeloq question
Your earlier thread maps to **one chip, two cores**:

```
STM32WB55RG
├─ Cortex-M4 (application)         ← the firmware you flash (Official/Unleashed/RM/Momentum)
│   └─ AES1 hardware block          ← does the actual decrypt; key loaded into it, not readable
└─ Cortex-M0+ (radio)              ← BLE 5.4 stack + FUS
    └─ FUS → Customer Key Storage   ← the "secure enclave": slot 1 = Sub-GHz keystore key
        (factory-provisioned; survives M4 reflash; no key read-back; wiped only by
         mass-erase / RDP regression / FUS wipe — see SECURITY.md)
```

Encrypted manufacturer keys sit on the **MicroSD** (`keeloq_mfcodes`); the **CC1101**
transmits the resulting Keeloq frames; the **WB55 enclave** holds the slot-1 key that
unlocks the keystore. Three different parts on the spec sheet, one capability.

## Sources
- Hardware: <https://docs.flipper.net/zero/development/hardware/tech-specs>
- Firmware citations: see `SECURITY.md`, `PROVENANCE.md`, and the per-node evidence in
  the explorer (`index.html`). Code references are repo-relative to the pinned
  submodules under `src/`.
