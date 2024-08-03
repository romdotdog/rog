import { fromHex, toHex } from "./utils";

const algorithm: EcKeyGenParams = {
    name: "ECDSA",
    namedCurve: "P-256",
};

export function generateKeyPair() {
    return window.crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
}

export async function importPKCS8PrivateKey(key: ArrayBuffer, raw?: ArrayBuffer, error = false) {
    console.log(toHex(new Uint8Array(key)));
    try {
        return await window.crypto.subtle.importKey("pkcs8", key, algorithm, true, ["sign"]);
    } catch (e) {
        console.error(e);
        if (error) {
            throw new Error("pkcs8 encoding failed");
        }

        // firefox doesn't allow importing pkcs8 without public key
        const elliptic = await import("elliptic");
        if (raw === undefined) {
            console.log("aa" + key);
            raw = readPKCS8PrivateKey(key);
        }

        const ec = new elliptic.ec("p256");
        const keyPair = ec.keyFromPrivate(new Uint8Array(raw));
        const publicKey = new Uint8Array(keyPair.getPublic().encode("array", false));
        console.log("public key", toHex(publicKey));
        const newKey = writePKCS8(raw, publicKey.buffer);
        return importPKCS8PrivateKey(newKey, raw, true);
    }
}

export function importRawPrivateKey(key: ArrayBuffer) {
    const pkcs8Key = writePKCS8(key);
    console.log(toHex(new Uint8Array(pkcs8Key)));
    return importPKCS8PrivateKey(pkcs8Key);
}

// https://stackoverflow.com/questions/56807959/generate-public-key-from-private-key-using-webcrypto-api
export async function derivePublicKey(privateKey: CryptoKey) {
    const jwk = await crypto.subtle.exportKey("jwk", privateKey);

    // remove private data from JWK
    delete jwk.d;
    jwk.key_ops = ["verify"];

    // import public key
    return await crypto.subtle.importKey("jwk", jwk, algorithm, true, ["verify"]);
}

export function exportRawPublicKey(k: CryptoKey) {
    return window.crypto.subtle.exportKey("raw", k);
}

export async function exportRawPrivateKey(k: CryptoKey) {
    const key = await crypto.subtle.exportKey("pkcs8", k);
    return readPKCS8PrivateKey(key);
}

enum Section {
    Integer = 0x02,
    BitString = 0x03,
    OctetString = 0x04,
    Sequence = 0x30,
    OptionalData = 0xa1,
}

interface Decoder {
    view: DataView;
    offset: number;
}

function makeDecoder(buffer: ArrayBuffer): Decoder {
    return {
        view: new DataView(buffer),
        offset: 0,
    };
}

function readLength(decoder: Decoder): number {
    let length = decoder.view.getUint8(decoder.offset++);
    if (length & 0x80) {
        let numBytes = length & 0x7f;
        length = 0;
        for (let i = 0; i < numBytes; i++) {
            length = (length << 8) | decoder.view.getUint8(decoder.offset++);
        }
    }
    return length;
}

function readSection(decoder: Decoder, section: Section): ArrayBuffer {
    if (decoder.view.getUint8(decoder.offset++) !== section) {
        throw new Error(`Expected section 0x${section.toString(16)} (${Section[section]})`);
    }
    const length = readLength(decoder);
    const sequence = decoder.view.buffer.slice(decoder.offset, (decoder.offset += length));
    return sequence;
}

function readPKCS8PrivateKey(key: ArrayBuffer): ArrayBuffer {
    let decoder = makeDecoder(key);
    decoder = makeDecoder(readSection(decoder, Section.Sequence)); // Go into the core sequence

    readSection(decoder, Section.Integer); // Skip the version
    readSection(decoder, Section.Sequence); // Skip the privateKeyAlgorithm sequence

    decoder = makeDecoder(readSection(decoder, Section.OctetString)); // Go into the octet string
    decoder = makeDecoder(readSection(decoder, Section.Sequence)); // Go into the inner sequence

    readSection(decoder, Section.Integer); // Skip the inner version
    return readSection(decoder, Section.OctetString); // Get the private key
}

interface Encoder {
    view: DataView;
    offset: number;
}

let _lazyWorkspace: ArrayBuffer;
function getWorkspace(): ArrayBuffer {
    if (!_lazyWorkspace) {
        _lazyWorkspace = new ArrayBuffer(250);
    }
    return _lazyWorkspace;
}

// N.B. only one of these can be live at once since the buffer is singular
function makeEncoder(): Encoder {
    return {
        view: new DataView(getWorkspace()),
        offset: 0,
    };
}

function finishEncoder(encoder: Encoder): ArrayBuffer {
    const copy = new Uint8Array(encoder.offset);
    copy.set(new Uint8Array(encoder.view.buffer, 0, encoder.offset));
    encoder.offset = 0;
    return copy.buffer;
}

function writeLength(encoder: Encoder, length: number) {
    if (length < 0x80) {
        encoder.view.setUint8(encoder.offset++, length);
    } else {
        let numBytes = 1;
        for (let tempLength = length; tempLength > 0xff; tempLength >>= 8) {
            numBytes++;
        }
        encoder.view.setUint8(encoder.offset++, numBytes | 0x80);
        for (let i = numBytes - 1; i >= 0; i--) {
            encoder.view.setUint8(encoder.offset++, (length >> (i * 8)) & 0xff);
        }
    }
}

function writeSection(encoder: Encoder, section: Section, contents: ArrayBuffer) {
    encoder.view.setUint8(encoder.offset++, section);
    if (section === Section.BitString) {
        writeLength(encoder, contents.byteLength + 1);
        encoder.view.setUint8(encoder.offset++, 0);
    } else {
        writeLength(encoder, contents.byteLength);
    }
    new Uint8Array(encoder.view.buffer, encoder.offset, contents.byteLength).set(new Uint8Array(contents));
    encoder.offset += contents.byteLength;
}

// [algid]
// alg=OID:id-ecPublicKey
// parm=OID:prime256v1
const algorithmIdentifier = fromHex("06072a8648ce3d020106082a8648ce3d030107");

function writePKCS8(privateKey: ArrayBuffer, publicKey?: ArrayBuffer): ArrayBuffer {
    let encoder = makeEncoder();

    let publicKeyBitstring: ArrayBuffer | undefined;
    if (publicKey) {
        writeSection(encoder, Section.BitString, publicKey);
        publicKeyBitstring = finishEncoder(encoder);
    }

    writeSection(encoder, Section.Integer, new Uint8Array([0x01]).buffer); // Version
    writeSection(encoder, Section.OctetString, privateKey);

    if (publicKeyBitstring) {
        writeSection(encoder, Section.OptionalData, publicKeyBitstring);
    }

    const innerSequence = finishEncoder(encoder);
    writeSection(encoder, Section.Sequence, innerSequence);

    const innerSequenceOctetString = finishEncoder(encoder);

    writeSection(encoder, Section.Integer, new Uint8Array([0x00]).buffer); // Version
    writeSection(encoder, Section.Sequence, algorithmIdentifier);
    writeSection(encoder, Section.OctetString, innerSequenceOctetString);

    const coreSequence = finishEncoder(encoder);
    writeSection(encoder, Section.Sequence, coreSequence);

    return finishEncoder(encoder);
}
