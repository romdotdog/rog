import init, { pow } from "../../rogpow-wasm/rogpow";
import wasm from "../../rogpow-wasm/rogpow_bg.wasm?url";

const initPromise = init(wasm);
onmessage = async e => {
    console.log("starting pow", e.data);
    await initPromise;
    postMessage(pow(e.data));
};
