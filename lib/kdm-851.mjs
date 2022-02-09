import { BasicKituramiDCMat } from "./kiturami-dc-mat.mjs";

export class KDM851 extends BasicKituramiDCMat {
    constructor(address, log) {
        super(address, log);
    }

    async getCurrentTemp() {
        let hexArray = await this._getHexArray()
        return parseInt(hexArray[4], 16);
    }

    async getTargetTemp() {
        let hexArray = await this._getHexArray()
        return parseInt(hexArray[3], 16);
    }

    async setTargetTemp(temp) {
        let hexTemp = temp.toString(16);
        await this._writeValue(`f00102${hexTemp}fe`);
    }

    async getOn() {
        let hexArray = await this._getHexArray();
        return hexArray[1] === '11' ? 1 : 0;
    }

    async setOn(value) {
        await this._writeValue(value === 1 ? 'f0010101fe' : 'f0010102fe');
    }
}
