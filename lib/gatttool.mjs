import { spawn } from "child_process";

export class Gatttool {
    constructor(address) {
        this._address = address;
        this._connected = false;
        this._gatttool = null;
    }

    get connected() {
        return this._connected;
    }

    connect() {
        this._gatttool = spawn('gatttool', ['-b', this._address, '-t', 'random', '-I']);
        this._gatttool.stdin.write('connect\n');
        let eventCancelled = false;

        return new Promise((resolve, reject) => {
            let connectTimeout = setTimeout(() => {
                eventCancelled = true;
                this.disconnect().then(() => {
                    reject(new Error("Couldn't connect in 3.5 seconds. Is the device in range or is the address correct?"));
                });
            }, 3500);

            this._gatttool.stdout.on('data', (data) => {
                if (eventCancelled) return;

                clearTimeout(connectTimeout);
                let str = data.toString();
                if (str.includes('Connection successful')) {
                    this._connected = true;
                    resolve();
                } else if (str.includes('Error')) {
                    this.disconnect().then(() => {
                        reject(new Error('Failed to connect to ' + this._address + ': ' + str.split('\n')[0].split(': ')[2]));
                    });
                }

            });
        });
    }

    readHandle(handle) {
        return new Promise((resolve, reject) => {
            this._gatttool.stdin.write(`char-read-hnd ${handle}\n`);
            this._gatttool.stdout.on('data', (data) => {
                let str = data.toString();
                if (str.includes('failed')) {
                    reject(new Error('Failed to read handle: ' + str.split(': ')[2]));
                } else if (str.includes('Characteristic value/descriptor')) {
                    let value = str.split('\n')[0].split(': ')[1];
                    resolve(value);
                }
            });
        });
    }

    writeHandleCommand(handle, data) {
        return new Promise((resolve) => {
            this._gatttool.stdin.write(`char-write-cmd 0x${handle} ${data}\n`);
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }

    writeHandleRequest(handle, data) {
        return new Promise((resolve, reject) => {
            this._gatttool.stdin.write(`char-write-req 0x${handle} ${data}\n`);
            this._gatttool.stdout.on('data', (data) => {
                let str = data.toString();
                if (str.includes('Characteristic value was written successfully')) {
                    resolve();
                } else if (str.includes('Error')) {
                    reject(new Error('Write request failed: ' + str.split(': ')[2]));
                }
            });
        });
    }

    disconnect() {
        this._gatttool.stdin.write('disconnect\n');

        return new Promise((resolve) => {
            this._gatttool.stdout.on('data', () => {
                this._gatttool.kill('SIGTERM');
            });

            this._gatttool.on('exit', () => {
                this._connected = false;
                resolve();
            });
        });
    }
}