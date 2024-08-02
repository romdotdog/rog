import PowWorker from "./powWorker?worker";

const powWorker = new PowWorker();
export default function pow(bin: Uint8Array): Promise<number> {
    return new Promise(r => {
        powWorker.onmessage = e => {
            r(e.data);
        };
        console.log("posting");
        powWorker.postMessage(bin);
    });
}
