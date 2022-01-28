'use strict';

import { KituramiDCMat } from "./lib/kiturami-dc-mat.mjs";

let Service, Characteristic;

export default (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-kituramidcmat', 'KituramiDCMat', KituramiMatAccessory);
}

class KituramiMatAccessory {
    constructor(log, config) {
        this.log = log;
        this.mat = null;
        this.btAddress = config["btAddress"];
        this.pollEnabled = config["poll"];
        this.pollInterval = config["pollInterval"];
        this.mat = new KituramiDCMat(this.btAddress, this.log);
        this.timer = null;
        this.switchService = null;
    }

    getServices() {
        const informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Kiturami')
            .setCharacteristic(Characteristic.Model, 'Kiturami DC Mat')
            .setCharacteristic(Characteristic.SerialNumber, this.btAddress)

        this.switchService = new Service.Switch();
        this.switchService.getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        if (this.pollEnabled) this.startPollTimer();


        return [informationService, this.switchService];
    }

    startPollTimer(seconds = this.pollInterval) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.pollPowerState();
        }, this.pollInterval * 1000);
    }

    pollPowerState() {
        try {
            this.mat.getOn().then(isOn => {
                this.log.debug("Poll complete. Got power state: " + isOn);
                this.switchService.getCharacteristic(Characteristic.On).updateValue(isOn);
                this.timer = setTimeout(() => {
                    this.pollPowerState();
                }, this.pollInterval * 1000);
            });
        } catch (error) {
            this.log.error("Error while polling power state");
            this.log.error(error);
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
        const humanState = value ? 'on' : 'off';
        this.log(`Turning ${humanState}...`);

        try {
            await this.mat.setOn(value);
            this.active = value;
            this.log(`Turned ${humanState}`);
            callback();
        } catch (e) {
            callback(e);
        }
    }
}