'use strict';

import { BasicKituramiDCMat } from "./lib/kiturami-dc-mat.mjs";
import { KDM851 } from "./lib/kdm-851.mjs";

let Service, Characteristic;

export default (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-kituramidcmat', 'KituramiDCMat', KituramiMatAccessory);
}

class KituramiMatAccessory {
    constructor(log, config) {
        this.log = log;
        this.btAddress = config["btAddress"];
        this.useTempControl = config["useTempControl"];
        this.useAltSwitch = config["useAltSwitch"];
        this.service = null;

        if (this.useAltSwitch) {
            this.altSwitchService = null;
            this.altSwitchName = config["altSwitchName"];
        }

        if (this.useTempControl)
            this.mat = new KDM851(this.btAddress, this.log);
        else
            this.mat = new BasicKituramiDCMat(this.btAddress, this.log);
    }

    getServices() {
        if (this.useTempControl) {
            const informationService = new Service.AccessoryInformation()
                .setCharacteristic(Characteristic.Manufacturer, 'Kiturami')
                .setCharacteristic(Characteristic.Model, 'KDM-851')
                .setCharacteristic(Characteristic.SerialNumber, this.btAddress)

            this.service = new Service.Thermostat();
            this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                .on('get', this.getPowerState.bind(this));

            this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .on('get', this.getPowerState.bind(this))
                .on('set', this.setPowerState.bind(this));

            // no cooling state
            this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .setProps({
                    minValue: 0,
                    maxValue: 1,
                    validValues: [0,1]
                });

            this.service.getCharacteristic(Characteristic.CurrentTemperature)
                .on('get', this.getCurrentTemp.bind(this));

            this.service.getCharacteristic(Characteristic.TargetTemperature)
                .on('get', this.getTargetTemp.bind(this))
                .on('set', this.setTargetTemp.bind(this));

            // min temp is 25°C and max temp is 50°C
            this.service.getCharacteristic(Characteristic.TargetTemperature)
                .setProps({
                    minValue: 25,
                    maxValue: 50,
                    minStep: 1
                });

            // alt switch doesn't have a getter since it's updated together when thermostat is updated
            if (this.useAltSwitch) {
                this.altSwitchService = new Service.Switch(this.altSwitchName);
                this.altSwitchService.getCharacteristic(Characteristic.On)
                    .on('set', this.setAltSwitchState.bind(this));

                return [informationService, this.service, this.altSwitchService];
            } else {
                return [informationService, this.service];
            }
        } else {
            const informationService = new Service.AccessoryInformation()
                .setCharacteristic(Characteristic.Manufacturer, 'Kiturami')
                .setCharacteristic(Characteristic.Model, 'Kiturami DC Mat')
                .setCharacteristic(Characteristic.SerialNumber, this.btAddress)

            this.service = new Service.Switch();
            this.service.getCharacteristic(Characteristic.On)
                .on('get', this.getPowerState.bind(this))
                .on('set', this.setPowerState.bind(this));

            return [informationService, this.service];
        }
    }

    async setAltSwitchState(value, callback) {
        const humanState = value ? 'on' : 'off';
        this.log(`Turning ${humanState} via alt switch...`);

        try {
            await this.mat.setOn(value);
            this.log(`Turned ${humanState} via alt switch`);
            this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value ? 1 : 0);
            callback();
        } catch (e) {
            this.log.error(`Error while turning ${humanState} via alt switch`);
            this.log.error(e);
            callback(e);
        }
    }

    async getCurrentTemp(callback) {
        try {
            const temp = await this.mat.getCurrentTemp();
            callback(null, temp);
        } catch (e) {
            this.log.error("Error while getting current temp");
            this.log.error(e);
            callback(e);
        }
    }

    async getTargetTemp(callback) {
        try {
            const temp = await this.mat.getTargetTemp();
            callback(null, temp);
        } catch (e) {
            this.log.error("Error while getting target temp");
            this.log.error(e);
            callback(e);
        }
    }

    async setTargetTemp(value, callback) {
        this.log(`Setting target temp to ${value}`);

        try {
            await this.mat.setTargetTemp(value);
            this.log(`Target temp has been set to ${value}`);
            callback();
        } catch (e) {
            this.log.error("Error while setting target temp");
            this.log.error(e);
            callback(e);
        }
    }

    async getPowerState(callback) {
        try {
            const isOn = await this.mat.getOn();
            if (this.useAltSwitch) this.altSwitchService.getCharacteristic(Characteristic.On).updateValue(isOn === 1);
            callback(null, isOn);
        } catch (e) {
            this.log.error('Error while getting power state');
            this.log.error(e);
            callback(e);
        }
    }

    async setPowerState(value, callback) {
        const humanState = value ? 'on' : 'off';
        this.log(`Turning ${humanState}...`);

        try {
            await this.mat.setOn(value);
            this.log(`Turned ${humanState}`);
            callback();
        } catch (e) {
            this.log.error(`Error while turning ${humanState}`);
            this.log.error(e);
            callback(e);
        }
    }
}