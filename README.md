# Beca BHT-209-GCZB — Home Assistant / Zigbee2MQTT

A Zigbee2MQTT external converter and setup guide for the **Beca BHT-209-GCZB**, a
battery-powered Zigbee thermostat with a dry-contact relay for boiler control.

Out of the box, Zigbee2MQTT sees this device as an unsupported `TS0601` and exposes
nothing usable. The converter here teaches Zigbee2MQTT how to talk to it, giving you
a proper climate entity in Home Assistant.

## What's here

| File | Purpose |
|------|---------|
| `bht209.js` | The Zigbee2MQTT external converter |
| `beca-sonoff-ha.md` | Full setup guide — pairing, converter install, Home Assistant, dashboard |

## Device

- **Model ID:** `TS0601`
- **Manufacturer:** `_TZE284_4cgmagba`

If your unit reports a different manufacturer string, the datapoints may differ — the
guide explains how to verify them with Zigbee2MQTT debug logging.

## Quick install

1. Open the Zigbee2MQTT frontend and pair the thermostat (hold the down arrow ~5s with
   the unit switched off).
2. Add `bht209.js` as an external converter.
3. Restart Zigbee2MQTT. The device should be recognised as **BHT-209-GCZB by Beca**.

See [`beca-sonoff-ha.md`](beca-sonoff-ha.md) for the full walkthrough, including the
Home Assistant entities, the heating-mode safety gotcha, and dashboard setup.

## Datapoints

All verified on hardware.

| DP | Meaning | Encoding |
|----|---------|----------|
| 1 | State (on/off) | boolean |
| 16 | Setpoint | value ×10, read/write |
| 18 | Deadzone / hysteresis | raw, whole degrees (1–5) |
| 24 | Local temperature | value ×10, read only |
| 27 | Temperature calibration | raw, signed whole degrees (−9…9) |
| 34 | Max temperature limit | raw (35–45) |
| 36 | Running state | 0 = calling for heat, 1 = idle |
| 40 | Child lock | boolean |
| 104 | Heating mode | ON = heat, OFF = cool (keep ON for boiler) |

This variant does not appear to report battery over Zigbee. DP 102 and 103 are emitted but their function is unidentified, so they are omitted.

## Licence

MIT — use or adapt freely.
