# Getting a Beca BHT-209-GCZB Zigbee Thermostat Talking to Home Assistant

The Beca BHT-209-GCZB is a cheap, battery-powered Zigbee thermostat with a dry-contact relay for switching a boiler on and off. It's a great little device — but if you pair it with Home Assistant expecting it to just work, you'll be disappointed. It turns up as an unknown device and does nothing.

The reason: it's a Tuya device. It speaks Zigbee, but in its own dialect that Home Assistant doesn't understand out of the box. The fix is to hand Zigbee2MQTT a small **translation file** (a "converter") that teaches it how to talk to this exact thermostat. This post gives you that file and walks you through using it.

**If you have this exact model,** follow the Quick Start below, paste in the converter, and you'll have a working thermostat in Home Assistant. You do not need to understand the converter to use it.

**If you're curious how it works,** or you have a slightly different Tuya thermostat you want to adapt this for, the *Under the Hood* section near the end explains everything.

## What you need first

This guide assumes you already have a working Zigbee setup. Specifically:

| You need | Notes |
|---|---|
| A Zigbee coordinator | This was written with a **SONOFF ZBDongle-E**, but any coordinator works |
| **Zigbee2MQTT** installed and running | Not the built-in "ZHA" integration — this guide is Zigbee2MQTT-specific |
| An **MQTT broker** | Usually the Mosquitto add-on, already set up if Zigbee2MQTT is working |

If Zigbee2MQTT isn't installed and talking to Home Assistant yet, sort that out first — there are good guides for it — then come back here.

## A quick word about batteries

This thermostat runs on batteries, so to save power it **sleeps** most of the time and only wakes briefly to check in. Two things follow from that, and both are normal:

- When you change something from Home Assistant, it can take a few seconds up to about a minute to actually happen. Don't panic if it's not instant.
- Readings only update when the device wakes. An old-looking value isn't a broken one.

If you want it snappier and more reliable, plug in any mains-powered Zigbee device nearby (a smart plug is ideal). Mains devices act as relays and strengthen the whole network. On its own, the thermostat has a single link back to the coordinator and no backup path.

---

# Quick Start

## Step 1 — Pair the thermostat

1. In Zigbee2MQTT, turn on **Permit join**.
2. With the thermostat **switched off**, press and hold the **down arrow (∨)** for about 5 seconds. The screen flashes and shows the Zigbee icon — it's now in pairing mode.
3. Wait for Zigbee2MQTT to announce a new device. It'll appear as an **unsupported** device with a name like `TS0601`.

Seeing "unsupported" is expected at this stage — that's exactly what the next step fixes.

## Step 2 — Add the converter

1. Open the Zigbee2MQTT web interface.
2. Find the **external converters** area. Depending on your version, this is under the **Dev console**, or under Settings.
3. Create a new converter file called `bht209.js`.
4. Copy the entire code block below into it.
5. Save, then **restart Zigbee2MQTT**.

```js
const tuya = require('zigbee-herdsman-converters/lib/tuya');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const e = exposes.presets;
const ea = exposes.access;

module.exports = {
    fingerprint: [{modelID: 'TS0601', manufacturerName: '_TZE284_4cgmagba'}],
    model: 'BHT-209-GCZB',
    vendor: 'Beca',
    description: 'Battery Zigbee thermostat with dry contact for boiler control',
    fromZigbee: [tuya.fz.datapoints],
    toZigbee: [tuya.tz.datapoints],
    onEvent: tuya.onEventSetTime,
    configure: tuya.configureMagicPacket,
    exposes: [
        e.climate()
            .withLocalTemperature(ea.STATE)
            .withSetpoint('current_heating_setpoint', 10, 25, 0.5, ea.STATE_SET)
            .withSystemMode(['heat'], ea.STATE)
            .withRunningState(['idle', 'heat'], ea.STATE),
        e.child_lock(),
        e.binary('heating_mode', ea.STATE_SET, true, false)
            .withDescription('ON = heating, OFF = cooling. Must stay ON for boiler.')
            .withCategory('config'),
    ],
    meta: {
        tuyaDatapoints: [
            [16, 'current_heating_setpoint', tuya.valueConverter.divideBy10],
            [24, 'local_temperature', tuya.valueConverter.divideBy10],
            [36, 'running_state', tuya.valueConverterBasic.lookup({idle: 1, heat: 0})],
            [40, 'child_lock', tuya.valueConverter.lockUnlock],
            [104, 'heating_mode', tuya.valueConverter.raw],
        ],
    },
};
```

## Step 3 — Check it worked

After the restart, go back to the device in Zigbee2MQTT. **Its name should have changed** from the `TS0601` code to **BHT-209-GCZB by Beca**. That's your success signal.

In Home Assistant, you should now have a set of entities for the device:

| Entity | What it is |
|---|---|
| `climate.*` | The thermostat itself — target temperature, current temperature, whether it's calling for heat |
| `sensor.*_local_temperature` | The measured room temperature |
| `switch.*_heating_mode` | Heat/cool mode — **leave this ON** (see the warning below) |
| `switch.*_child_lock` | Locks the physical buttons |

There's also a hidden **link quality** sensor that tells you how strong the Zigbee signal is. It's switched off by default. To turn it on: Settings → Devices & Services → your Zigbee2MQTT integration → the device → find the disabled entity under **Diagnostic** and enable it. Handy for checking the thermostat is being heard, but remember it only refreshes when the device wakes.

## ⚠️ The one thing that will catch you out

The `switch.*_heating_mode` entity **must stay ON** for the boiler to work. This switch flips the thermostat between heating and cooling — and if it ever gets switched to OFF (cooling), your heating silently stops. No error, no warning, just a cold house and a lot of confusion.

Two ways to protect against it, covered next.

## Step 4 — Protect against accidental cooling mode

A short automation makes this safe: **if heating mode switches OFF, turn it back ON after a few seconds and send a notification.** An accidental change corrects itself almost immediately, and you're told it happened. If you build nothing else from this section, build this one.

## Step 5 — Put it on a dashboard

A standard **Thermostat card** pointed at the `climate.*` entity gives you the dial and temperature control — that's the main one you need.

Two nice-to-haves:

- Add a **conditional card** that only shows when heating mode is OFF, with a plain-English warning that heating won't work until it's switched back. This makes the invisible failure visible.
- If you set heating schedules with the popular Scheduler card, trim its options down to just "set temperature" so it doesn't clutter the screen with heating modes this device doesn't use.

---

# Under the Hood

*Everything past this point is optional. Skip it unless you want to understand the converter or adapt it for a different Tuya thermostat.*

## Why a converter is needed at all

Tuya devices don't report their data as nicely-labelled values. Instead they use **datapoints** — numbered slots, each holding one piece of information in a device-specific format. Datapoint 16 might be the target temperature; datapoint 36 might be whether it's heating. Nothing tells Home Assistant what those numbers mean.

The converter is the lookup table. It says "datapoint 16 is the setpoint, and it arrives multiplied by ten" and so on, turning anonymous numbers into the proper climate entity you saw in the Quick Start.

## The datapoint map

This is the heart of the converter — the `tuyaDatapoints` block:

| DP | Meaning | Encoding |
|---|---|---|
| 16 | Setpoint (target temperature) | Value ×10, read/write |
| 24 | Local temperature (measured) | Value ×10, read only |
| 36 | Running state | 0 = calling for heat, 1 = idle |
| 40 | Child lock | Boolean |
| 104 | Heating mode | `true` = heat, `false` = cool |

The details worth understanding:

- **The ×10 encoding.** Temperatures come across multiplied by ten — the device sends `215` to mean 21.5 °C. The `divideBy10` converter undoes that.
- **Running state is backwards.** You'd expect `1` to mean "on", but here `0` means the boiler is being called and `1` means idle. The `lookup` converter maps these to the right words for Home Assistant.
- **Heating mode must be `true`.** This is the datapoint behind that critical switch from the Quick Start. It's exposed separately so you can see and control it.
- **The setpoint range is a choice, not a limit.** The converter pins Home Assistant to 10–25 °C in the `withSetpoint` line. The thermostat itself goes higher — its settable ceiling can be configured up to 45 °C, and the sensor is rated to 95 °C for boiler use. Driving underfloor heating or something that wants a hotter target? Widen the `10, 25` numbers. It only affects Home Assistant; the unit's own buttons are unaffected.
- **Single mode on purpose.** The `withSystemMode(['heat'], ...)` line tells Home Assistant this is a heating-only device. Leave it out and you get a pointless dropdown offering cool, dry, fan-only and the rest — none of which mean anything for a boiler.

## Adapting this for a different Tuya thermostat

Tuya sells near-identical hardware under many different code names. The model ID is the same `TS0601` for loads of devices; what distinguishes them is the **manufacturer string**. This one reports:

- Model ID: `TS0601`
- Manufacturer: `_TZE284_4cgmagba`

If yours shows a different `_TZE284_...` or `_TZE200_...` string, this converter is a good starting point but the datapoint numbers may differ. Here's how to check them yourself:

1. Turn on **debug logging** in Zigbee2MQTT.
2. Operate the physical thermostat one action at a time — change the setpoint, toggle the lock, let it call for heat.
3. Watch the logs to see which datapoint number changes and what value it sends.
4. Match what you did to what appeared, and you've mapped that datapoint.

That's exactly how the table above was built and verified against a real unit — treat it as a hypothesis to confirm, not gospel.

## On-device advanced settings

Some behaviour is set at the thermostat itself, not over Zigbee, and Home Assistant can't see it. To reach these: turn the thermostat off, then press and hold the menu/mode button for about 5 seconds, and use the arrows to step through the codes.

| Code | Function | Range | Default |
|---|---|---|---|
| 1 | Temperature compensation | -9 to 9 °C | -1 |
| 2 | Humidity compensation | -9 to 9 | -2 |
| 3 | Deadzone (hysteresis) | 1–5 °C | 1 |
| 4 | Button locking | 00 = all, 01 = all but power | 1 |
| 5 | Min set temperature | 5–15 °C | 5 |
| 6 | Max set temperature | 35–45 °C | 45 |
| 7 | Eco set temperature | 5–15 °C | 1 |
| 8 | Restore factory settings | 00 = normal, 01 = factory | 00 |
| 9 | Firmware version | — | — |

The useful one is **code 3, the deadzone** — how far the temperature must fall below your target before the boiler fires, and rise above before it stops. A wider band means fewer, longer boiler cycles; a narrow band holds a tighter temperature but switches more often. Codes 5 and 6 set the limits the unit itself will accept, separate from whatever range you expose in Home Assistant.

## Troubleshooting

**The device name didn't change after restarting.**
The converter didn't load. Check the filename and that you saved it, confirm Zigbee2MQTT actually restarted, and look at the Zigbee2MQTT log for an error mentioning the converter.

**It changed to a different name, or still says unsupported.**
Your unit's manufacturer string is probably different from `_TZE284_4cgmagba`. Check it on the device page and, if so, follow *Adapting this for a different Tuya thermostat* above.

**The entity appears but values are blank or never update.**
Remember it's a sleepy battery device — give it a minute. Press a button on the unit to wake it. If it's still blank after a few minutes, the datapoint mapping may not match your hardware.

**Heating just stopped for no reason.**
Check `switch.*_heating_mode` — if it's OFF, that's your cause. See the warning in the Quick Start, and build the guard automation in Step 4.

---

*The converter code in this post is provided as-is, for anyone to use or adapt.*
