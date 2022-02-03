import { Gatttool } from './gatttool.mjs';

export class KituramiDCMat {
    constructor(address, log) {
        this._address = address;
        this._gatttool = new Gatttool(this._address);
        this.log = log;
        this.busy = false;
        this.disconnectTimer = null;
    }

    async _connect() {
        if (this._gatttool.connected) {
            await this.clearDisconnectTimer();
            this.disconnectTimer = null;
            return;
        }
        this.log.debug('Connecting to ' + this._address);

        let tryCount = 0;

        try {
            await this._gatttool.connect();
        } catch (e) {
            if (tryCount < 2) {
                tryCount++;
            } else {
                this.log.error('Failed to connect 3 times. Aborting.')
                throw e;
            }
        }

        await this._gatttool.writeHandleRequest('0010', '0100');
        await this._gatttool.writeHandleCommand('000d', 'f0020000fe');
    }

    async _disconnect() {
        if (!this._gatttool.connected) {
            return;
        } else if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
        }

        this.disconnectTimer = setTimeout(() => {
            if (!this.busy) {
                this.log.debug('Disconnecting from ' + this._address);
                this._gatttool.disconnect();
                this.disconnectTimer = null;
            }
        }, 10000)
    }

    async clearDisconnectTimer() {
        clearTimeout(this.disconnectTimer);
        this.disconnectTimer = null;
    }

    async _getHexArray() {
        while (this.busy) {
            this.log.debug('Gatttool is busy. Waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            await this._connect();
            const response = await this._gatttool.readHandle('000f');
            this.busy = false;
            await this._disconnect();
            let hexArray = response.split(' ');
            this.log.debug(hexArray);

            if (hexArray.length === 11 && hexArray[0] === 'f0') {
                return hexArray
            } else {
                throw new Error('Invalid response');
            }

        } catch (e) {
            this.busy = false;
            await this._disconnect();
            throw new Error(e);
        }
    }

    async _writeValue(value) {
        while (this.busy) {
            this.log.debug('Gatttool is busy. Waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            await this._connect();
            await this._gatttool.writeHandleCommand(value);
            this.busy = false;
            await this._disconnect();

        } catch (e) {
            await this._disconnect();
            this.busy = false;
            throw new Error(e);
        }
    }

    async getOn() {
        let hexArray = await this._getHexArray();
        return hexArray[1] === '11';
    }

    async setOn(value) {
        await this._writeValue(value ? 'f0010101fe' : 'f0010102fe');
    }
}
