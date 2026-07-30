
Claude finished the response
LICENSE

Initial commit

1 hour ago
README.md

Create README.md

1 hour ago
beca-sonoff-ha.md

Add files via upload

1 hour ago
bht209.js

Add files via upload

1 hour ago

Show more
The repo has all four files. Need to check the contents of bht209.js — the file list doesn't tell us which version it is.

Click bht209.js in the repo to open it, and look at the tuyaDatapoints section near the bottom. Tell me whether it lists 9 datapoints (1, 16, 18, 24, 27, 34, 36, 40, 104) or just 5 (16, 24, 36, 40, 104).

If it's the old 5, we replace it with the tested 9-DP version. If it's already 9, nothing to do.

/**
 * Zigbee2MQTT external converter for the Beca BHT-209-GCZB
 * ---------------------------------------------------------
 * Battery-powered Zigbee thermostat with a dry-contact relay for boiler control.
 *
 * Device fingerprint:
 *   modelID:          TS0601
 *   manufacturerName: _TZE284_4cgmagba
 *
 * If your unit reports a different manufacturer string, the datapoints below
 * may not match — see the accompanying guide for how to verify them via
 * Zigbee2MQTT debug logging.
 *
 * Installation:
 *   Add this file as an external converter in the Zigbee2MQTT frontend
 *   (Dev console / external converters), then restart Zigbee2MQTT. The device
 *   should be recognised as "BHT-209-GCZB by Beca".
 *
 * Datapoints:
 *   16  Setpoint (target temp)   value x10, read/write
 *   24  Local temperature         value x10, read only
 *   36  Running state             0 = calling for heat, 1 = idle
 *   40  Child lock                boolean
 *   104 Heating mode              true = heat, false = cool (keep true for boiler)
 *
 * Provided as-is, for anyone to use or adapt. MIT licence.
 */
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

Show more
That's the old 5-DP version — needs replacing with the tested 9-DP one. Let me build the external-converter file with the updated header and the final tested datapoints.


Build updated 9-DP external converter and check it loads as valid JS
Build updated 9-DP external converter and check it loads as valid JS
The require failed only because the zigbee-herdsman-converters library isn't installed here — that's expected, not a fault in the file. Let me verify the JS syntax itself is valid instead.


Check JS syntax validity and datapoint count
Check JS syntax validity and datapoint count
Valid JavaScript, 9 datapoints. Matches the tested version.


Presented file
Presented file
Updated bht209.js above — 9 tested datapoints, updated header comment, syntax-checked.

To replace it in your repo (web editor, no download needed):

Open bht209.js in your beca-bht209-homeassistant repo
Click the pencil icon (edit)
Ctrl+A, delete everything
Paste the full contents of the new bht209.js (from the file above, or the code block I can print if the download won't work)
Scroll down → Commit changes → commit message like "Update to tested 9-datapoint converter" → Commit
That brings your public repo in line with what's in the PR.

Want me to print the code inline in case the download button gives you trouble again?


Bht209
JS 

# Getting a Beca BHT-209-GCZB Zigbee Thermostat Talking to Home Assistant The Beca BHT-209-GCZB is a cheap, battery-powered Zigbee thermostat with a dry-contact relay for switching a boiler on and off. It's a great little device — but if you pair it with Home Assistant expecting it to just work, yo

pasted

Read me right?

That upload came through empty again — nothing in it for me to read.

If you're asking whether the converter reads correctly / is right: yes, the new bht209.js is the tested 9-datapoint version, syntax-checked, matching what's in your PR. It's good to commit.

If you meant something else, re-share or just type it — the file's arriving blank on my end.


README(1).md
48 lines

md

Is that right?


Read the uploaded README to check its contents
Read the uploaded README to check its contents
That's the README, and it's mostly right — but the Datapoints table is outdated. It lists the old 5 DPs, not the tested 9. It should match the converter you're putting in.

Everything else (intro, install steps, device fingerprint, licence) is correct.

Let me fix the datapoint table to match the 9-DP converter.


Ran a command, read a file
Ran a command, read a file
Updated README above — datapoint table now shows all 9 tested DPs, with the battery/102/103 note added. Everything else was already correct.

So you have two files to update in the repo:

File	Change
bht209.js	Replace with 9-DP tested converter
README.md	Replace with the corrected datapoint table
Both via the repo's pencil-edit → select all → paste → commit.

One more to check while we're at it: beca-sonoff-ha.md (the main guide) also had a datapoint table. It may still show 5. Worth confirming it matches too — open it in the repo and check its "The datapoint map" section. Want to verify that one as well, or leave it?


Readme
Document · MD 


You’ve used 90% of your session limit
Get more usage





Claude is AI and can make mistakes. Please double-check responses.


Readme · MD
Beca BHT-209-GCZB — Home Assistant / Zigbee2MQTT
A Zigbee2MQTT external converter and setup guide for the Beca BHT-209-GCZB, a battery-powered Zigbee thermostat with a dry-contact relay for boiler control.

Out of the box, Zigbee2MQTT sees this device as an unsupported TS0601 and exposes nothing usable. The converter here teaches Zigbee2MQTT how to talk to it, giving you a proper climate entity in Home Assistant.

What's here
File	Purpose
bht209.js	The Zigbee2MQTT external converter
beca-sonoff-ha.md	Full setup guide — pairing, converter install, Home Assistant, dashboard
Device
Model ID: TS0601
Manufacturer: _TZE284_4cgmagba
If your unit reports a different manufacturer string, the datapoints may differ — the guide explains how to verify them with Zigbee2MQTT debug logging.

Quick install
Open the Zigbee2MQTT frontend and pair the thermostat (hold the down arrow ~5s with the unit switched off).
Add bht209.js as an external converter.
Restart Zigbee2MQTT. The device should be recognised as BHT-209-GCZB by Beca.
See beca-sonoff-ha.md for the full walkthrough, including the Home Assistant entities, the heating-mode safety gotcha, and dashboard setup.

Datapoints
All verified on hardware.

DP	Meaning	Encoding
1	State (on/off)	boolean
16	Setpoint	value ×10, read/write
18	Deadzone / hysteresis	raw, whole degrees (1–5)
24	Local temperature	value ×10, read only
27	Temperature calibration	raw, signed whole degrees (−9…9)
34	Max temperature limit	raw (35–45)
36	Running state	0 = calling for heat, 1 = idle
40	Child lock	boolean
104	Heating mode	ON = heat, OFF = cool (keep ON for boiler)
This variant does not appear to report battery over Zigbee. DP 102 and 103 are emitted but their function is unidentified, so they are omitted.

Licence
MIT — use or adapt freely.


