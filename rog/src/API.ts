import { cache } from "@solidjs/router";
import { encode, decode } from "@msgpack/msgpack";
import { fromHex, toHex } from "./utils";
import {
    derivePublicKey,
    exportRawPrivateKey,
    exportRawPublicKey,
    generateKeyPair,
    importPKCS8PrivateKey,
    importRawPrivateKey,
} from "./Crypto";

const init = (async () => {
    let privateKey: CryptoKey;
    let publicKey: CryptoKey;

    const storedKey = localStorage.getItem("key");
    if (storedKey) {
        privateKey = await importPKCS8PrivateKey(fromHex(storedKey).buffer);
        publicKey = await derivePublicKey(privateKey);
    } else {
        const keyPair = await generateKeyPair();
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;

        const buf = await window.crypto.subtle.exportKey("pkcs8", privateKey);
        localStorage.setItem("key", toHex(new Uint8Array(buf)));
    }

    return {
        privateKey,
        privateKeyRaw: await exportRawPrivateKey(privateKey),
        publicKey,
        publicKeyRaw: await exportRawPublicKey(publicKey),
    };
})();

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
    const { privateKeyRaw } = await init;

    const pow = await import("./pow");
    const nonce = await pow.default(
        encode({
            author,
            content,
        })
    );
    console.log(nonce);

    // assume low entropy because why not
    const pbkdf2Data = await window.crypto.subtle.importKey("raw", privateKeyRaw, "PBKDF2", false, ["deriveBits"]);

    const privateKey = await window.crypto.subtle
        .deriveBits(
            {
                name: "PBKDF2",
                salt: await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(author)),
                iterations: 100000,
                hash: "SHA-256",
            },
            pbkdf2Data,
            256
        )
        .then(importRawPrivateKey);

    const publicKey = await derivePublicKey(privateKey).then(exportRawPublicKey);
    console.log(publicKey);
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
        key: new Uint8Array(publicKey),
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
