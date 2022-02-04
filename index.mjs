'use strict';

import { KituramiDCMat } from "./lib/kiturami-dc-mat.mjs";
import { KDM851 } from "./lib/kdm-851.mjs";

export default (api) => {
    api.registerAccessory('homebridge-kituramidcmat', 'KituramiDCMat', KituramiMatAccessory);
}

class KituramiMatAccessory {
    constructor(log, config) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;

        this.btAddress = this.config["btAddress"];
        this.useTempControl = this.config["useTempControl"];
        this.service = null;

        if (useTempControl) {
            this.mat = new KDM851(this.btAddress, this.log);

            const informationService = new this.Service.AccessoryInformation()
                .setCharacteristic(this.Characteristic.Manufacturer, 'Kiturami')
                .setCharacteristic(this.Characteristic.Model, 'KDM-851')
                .setCharacteristic(this.Characteristic.SerialNumber, this.btAddress)

            this.service = new this.Service(this.Service.Thermostat);
            this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
                .on('get', this.getPowerState.bind(this));

            this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
                .onGet(this.getPowerState().bind(this))
                .onSet(this.setPowerState().bind(this));

            this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
                .setProps({
                    minValue: 0,
                    maxValue: 1,
                    validValues: [0,1]
                });

            this.service.getCharacteristic(this.Characteristic.CurrentTemperature)
                .onGet(this.getCurrentTemp().bind(this));

            this.service.getCharacteristic(this.Characteristic.TargetTemperature)
                .onGet(this.getTargetTemp().bind(this))
                .onSet(this.setTargetTemp().bind(this));

            this.service.getCharacteristic(this.Characteristic.TargetTemperature)
                .setProps({
                    minValue: 25,
                    maxValue: 50,
                    minStep: 1
                });
        } else {
            this.mat = new KituramiDCMat(this.btAddress, this.log);

            const informationService = new this.Service.AccessoryInformation()
                .setCharacteristic(this.Characteristic.Manufacturer, 'Kiturami')
                .setCharacteristic(this.Characteristic.Model, 'Kiturami DC Mat')
                .setCharacteristic(this.Characteristic.SerialNumber, this.btAddress)

            this.service = new this.Service(this.Service.Switch);
            this.service.getCharacteristic(this.Characteristic.On)
                .on('get', this.getPowerState.bind(this))
                .on('set', this.setPowerState.bind(this));
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
            callback(e);
        }
    }

    async getPowerState(callback) {
        try {
            const isOn = await this.mat.getOn();
            callback(null, isOn);
        } catch (e) {
            callback(e);
        }
    }

    async setPowerState(value, callback) {
        const humanState = value === 1 ? 'on' : 'off';
        this.log(`Turning ${humanState}...`);

        try {
            await this.mat.setOn(value);
            this.log(`Turned ${humanState}`);
            callback();
        } catch (e) {
            this.log.error("Error while changing power state");
            callback(e);
        }
    }
}