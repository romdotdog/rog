import { cache } from "@solidjs/router";
import { encode, decode } from "@msgpack/msgpack";
import { fromHex, toHex } from "./utils";

const algorithm: EcKeyGenParams = {
    name: "ECDSA",
    namedCurve: "P-256",
};

const init = (async () => {
    let privateKey: CryptoKey;
    let publicKey: CryptoKey;

    const storedKey = localStorage.getItem("key");
    if (storedKey) {
        privateKey = await window.crypto.subtle.importKey("pkcs8", fromHex(storedKey), algorithm, true, ["sign"]);
        publicKey = await derivePublicKey(privateKey);
    } else {
        const keyPair = await window.crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;

        const buf = await window.crypto.subtle.exportKey("pkcs8", privateKey);
        localStorage.setItem("key", toHex(new Uint8Array(buf)));
    }

    return {
        privateKey,
        publicKey,
        publicKeyRaw: new Uint8Array(await window.crypto.subtle.exportKey("raw", publicKey)),
    };
})();

// https://stackoverflow.com/questions/56807959/generate-public-key-from-private-key-using-webcrypto-api
async function derivePublicKey(privateKey: CryptoKey) {
    const jwk = await crypto.subtle.exportKey("jwk", privateKey);

    // remove private data from JWK
    delete jwk.d;
    delete jwk.dp;
    delete jwk.dq;
    delete jwk.q;
    delete jwk.qi;
    jwk.key_ops = ["verify"];

    // import public key
    return await crypto.subtle.importKey("jwk", jwk, algorithm, true, ["verify"]);
}

interface PostPreview {
    hash: Uint8Array;
    author: string;
    preview: string;
    keyChecksum: Uint8Array;
    timestamp: number;
}

export const getFeed = cache(async () => {
    const buf = await fetch("https://rog-backend.r-om.workers.dev").then(r => r.arrayBuffer());
    return decode(buf) as PostPreview[];
}, "getFeed");

interface Post {
    author: string;
    content: string;
    key: Uint8Array;
    signature: Uint8Array;
    timestamp: number;
}

export const getPost = cache(async (hash: string) => {
    const buf = await fetch(`https://rog-backend.r-om.workers.dev/post/${hash}`).then(r => r.arrayBuffer());
    return decode(buf) as Post;
}, "getPost");

export async function publishPost(author: string, content: string): Promise<string> {
    const { privateKey, publicKeyRaw } = await init;

    const pow = await import("./pow");
    const nonce = await pow.default(
        encode({
            author,
            content,
        })
    );
    console.log(nonce);

    const signature = await window.crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: "SHA-256",
        },
        privateKey,
        encode({
            author,
            content,
            nonce,
        })
    );

    const body = encode({
        author,
        content,
        key: publicKeyRaw,
        signature: new Uint8Array(signature),
        nonce,
    });

    const r = await fetch("https://rog-backend.r-om.workers.dev/submit", {
        method: "POST",
        body,
    });

    if (r.status !== 200) {
        throw new Error(await r.text());
    }

    return toHex(new Uint8Array(await r.arrayBuffer()));
}
