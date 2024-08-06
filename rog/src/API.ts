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

const backend = import.meta.env.VITE_BACKEND;
if (!backend) {
    throw new Error("missing BACKEND env variable");
}

const init = (async () => {
    let root: Uint8Array;

    const storedRoot = localStorage.getItem("root");
    if (storedRoot) {
        root = fromHex(storedRoot);
    } else {
        root = crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem("root", toHex(root));
    }

    return root;
})();

interface PostPreview {
    hash: Uint8Array;
    author: string;
    preview: string;
    replyingTo?: Uint8Array;
    replyingToPreview?: string;
    keyChecksum: Uint8Array;
    timestamp: number;
    participating: number;
}

export const getFeed = cache(async () => {
    const buf = await fetch(backend).then(r => r.arrayBuffer());
    return decode(buf) as PostPreview[];
}, "getFeed");

interface Post {
    author: string;
    content: string;
    replyingTo?: Uint8Array;
    replyingToPreview?: string;
    key: Uint8Array;
    signature: Uint8Array;
    timestamp: number;
    participating: number;
}

export const getPost = cache(async (hash: string) => {
    const buf = await fetch(`${backend}/post/${hash}`).then(r => r.arrayBuffer());
    return decode(buf) as Post;
}, "getPost");

export async function publishPost(author: string, content: string, replyingTo?: string): Promise<string> {
    const root = await init;

    const pow = await import("./pow");
    const nonce = await pow.default(
        encode({
            author,
            content,
        }),
    );

    // assume low entropy because why not
    const pbkdf2Data = await window.crypto.subtle.importKey("raw", root, "PBKDF2", false, ["deriveBits"]);

    const privateKey = await window.crypto.subtle
        .deriveBits(
            {
                name: "PBKDF2",
                salt: await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(author)),
                iterations: 100000,
                hash: "SHA-256",
            },
            pbkdf2Data,
            256,
        )
        .then(importRawPrivateKey);

    const publicKey = await derivePublicKey(privateKey).then(exportRawPublicKey);
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
        }),
    );

    const body = encode({
        author,
        content,
        key: new Uint8Array(publicKey),
        signature: new Uint8Array(signature),
        nonce,
        ...(replyingTo ? { replyingTo: fromHex(replyingTo) } : {}),
    });

    const r = await fetch(`${backend}/submit`, {
        method: "POST",
        body,
    });

    if (r.status !== 200) {
        throw new Error(await r.text());
    }

    return toHex(new Uint8Array(await r.arrayBuffer()));
}

export async function subUnsubNotifications(token: string, subscribe: boolean) {
    const r = await fetch(`${backend}/${subscribe ? "subscribe" : "unsubscribe"}`, {
        method: "POST",
        body: token,
    });

    return r.ok;
}
