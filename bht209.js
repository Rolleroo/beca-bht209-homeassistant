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
