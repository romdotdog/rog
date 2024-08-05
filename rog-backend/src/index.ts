import { encode, decode } from "@msgpack/msgpack";
import { Buffer } from "node:buffer";

import init, { check } from "../../rogpow-wasm/rogpow";
import wasm from "../../rogpow-wasm/rogpow_bg.wasm";

const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
});

const msgpack = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
    "Content-Type": "application/x-msgpack",
});

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method === "OPTIONS") {
            return new Response(null, { headers });
        }

        if (path === "/" && request.method === "GET") {
            return handleFeed(env);
        } else if (path.startsWith("/post/") && request.method === "GET") {
            const postId = path.split("/post/").slice(1).join("/post/"); // we want to be proper
            return handleGetPost(env, postId);
        } else if (path === "/submit" && request.method === "POST") {
            return handleSubmit(request, env);
        } else if (path === "/subscribe" && request.method === "POST") {
            return handleSubUnsub(request, env, true);
        } else if (path === "/unsubscribe" && request.method === "POST") {
            return handleSubUnsub(request, env, false);
        } else {
            return new Response("not found", { status: 404, headers });
        }
    },
} satisfies ExportedHandler<Env>;

async function handleFeed(env: Env) {
    const { results } = await env.DB.prepare(
        `SELECT 
            p.hash, 
            p.author, 
            substr(p.key, 1, 5) AS keyChecksum, 
            p.preview, 
            p.timestamp,
            p.replyingTo,
            p.participating,
            r.preview AS replyingToPreview
        FROM 
            posts p
        LEFT JOIN 
            posts r
        ON 
            p.replyingTo = r.hash
        ORDER BY 
            p.timestamp DESC`
    ).all();

    for (const post of results) {
        post.hash = new Uint8Array(post.hash as number[]);
        post.keyChecksum = new Uint8Array(post.keyChecksum as number[]);
        if (post.replyingTo) {
            post.replyingTo = new Uint8Array(post.replyingTo as number[]);
        }
    }

    return new Response(encode(results), { headers: msgpack });
}

async function handleGetPost(env: Env, postHashHex: string) {
    const postHash = Buffer.from(postHashHex, "hex");

    const { results } = await env.DB.prepare(
        `SELECT 
            p.author, 
            p.content, 
            p.key, 
            p.signature, 
            p.timestamp, 
            p.replyingTo,
            p.participating,
            r.preview AS replyingToPreview
        FROM 
            posts p
        LEFT JOIN 
            posts r
        ON 
            p.replyingTo = r.hash
        WHERE 
            p.hash = ?;`
    )
        .bind(postHash)
        .all();

    if (results.length > 0) {
        const post = results[0];
        post.key = new Uint8Array(post.key as number[]);
        post.signature = new Uint8Array(post.signature as number[]);
        if (post.replyingTo) {
            post.replyingTo = new Uint8Array(post.replyingTo as number[]);
        }
        return new Response(encode(post), { headers: msgpack });
    }

    return new Response("not found", { status: 404, headers });
}

async function handleSubmit(request: Request, env: Env) {
    const data = await request.arrayBuffer();

    let decodedData;
    try {
        decodedData = decode(data) as { replyingTo?: Uint8Array };
    } catch {
        return new Response("error parsing data", { status: 400, headers });
    }

    // Validate data
    if (!(typeof decodedData === "object" && decodedData !== null)) {
        return new Response("invalid data", { status: 400, headers });
    }

    if (!("author" in decodedData && typeof decodedData.author === "string")) {
        return new Response("author is required", { status: 400, headers });
    }

    const author = decodedData.author.trim();
    if (author.length === 0) {
        return new Response("author is too short", { status: 400, headers });
    } else if (author.length > 32) {
        return new Response("author is too long", { status: 400, headers });
    }

    if (!("content" in decodedData && typeof decodedData.content === "string")) {
        return new Response("content is required", { status: 400, headers });
    }

    const content = decodedData.content.trim();
    if (content.length === 0) {
        return new Response("content is too short", { status: 400, headers });
    } else if (content.length > 25000) {
        return new Response("content is too long", { status: 400, headers });
    }

    if (!("key" in decodedData && decodedData.key instanceof Uint8Array)) {
        return new Response("key is required", { status: 400, headers });
    }

    if (!("signature" in decodedData && decodedData.signature instanceof Uint8Array)) {
        return new Response("signature is required", { status: 400, headers });
    }

    if (!("nonce" in decodedData && typeof decodedData.nonce === "number")) {
        return new Response("nonce is required", { status: 400, headers });
    }

    if ("replyingTo" in decodedData && !(decodedData.replyingTo instanceof Uint8Array)) {
        return new Response("replyingTo is not a buffer", { status: 400, headers });
    }

    // Check word count (yes seriously)
    if (decodedData.content.split(" ").filter(x => x.trim()).length < 100) {
        return new Response("content is too short", { status: 400, headers });
    }

    const [title] = splitTitle(decodedData.content);
    if (title === null) {
        return new Response("title is required (first line should be `# title here`)", { status: 400, headers });
    }

    if (title.length > 100) {
        return new Response("title is too long", { status: 400, headers });
    }

    // TODO: check if title is too long

    const signedBuffer = encode({
        author,
        content,
        nonce: decodedData.nonce,
    });

    const publicKey = await crypto.subtle.importKey(
        "raw",
        decodedData.key,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        false,
        ["verify"]
    );

    if (!crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, decodedData.signature, signedBuffer)) {
        return new Response("invalid signature", { status: 400, headers });
    }

    // proof of work
    const powBuffer = Buffer.from(
        encode({
            author,
            content,
        })
    );

    await init(wasm);

    if (!check(powBuffer, decodedData.nonce)) {
        return new Response("invalid nonce", { status: 400, headers });
    }

    if (decodedData.replyingTo) {
        const { results } = await env.DB.prepare(`SELECT 1 FROM posts WHERE hash = ? LIMIT 1;`).bind(decodedData.replyingTo).all();
        if (results.length === 0) {
            return new Response("the post you are replying to does not exist", { status: 400, headers });
        }
    }

    // Add metadata to the post (e.g., timestamp)
    const timestamp = Date.now();
    const postWithMetadata = {
        author,
        content,
        key: decodedData.key,
        signature: decodedData.signature,
        timestamp,
        // TODO: add proof of work
    };

    const hashBin = await crypto.subtle.digest("SHA-256", encode(postWithMetadata));

    const r = /^[^#\s](?:.{0,499}?\n|.{499})/m.exec(decodedData.content);
    const preview = decodedData.content.substring(0, r ? r.index + r[0].length : 500).trim();

    // Save post to DB
    await env.DB.prepare(
        `INSERT OR IGNORE INTO posts (hash, author, content, preview, key, signature, timestamp, replyingTo)
		            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
        .bind(hashBin, author, content, preview, decodedData.key, decodedData.signature, timestamp, decodedData.replyingTo ?? null)
        .run();

    const serviceAccount = JSON.parse(env.SERVICE_ACCOUNT);
    const token = await createToken(serviceAccount, "https://fcm.googleapis.com/");
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: {
                data: {
                    hash: Buffer.from(hashBin).toString("hex"),
                },
                notification: {
                    body: `New rog post from ${author}`,
                    title: preview,
                },
                topic: "all",
            },
        }),
    });

    if (!response.ok) {
        console.error(response.status, await response.text());
    }

    return new Response(hashBin, { headers: msgpack });
}

async function handleSubUnsub(request: Request, env: Env, subscribe: boolean) {
    const token = await request.text();
    const serviceAccount = JSON.parse(env.SERVICE_ACCOUNT);
    const auth = await authToken(env, serviceAccount);

    const r = await fetch(`https://iid.googleapis.com/iid/v1:batch${subscribe ? "Add" : "Remove"}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`,
            access_token_auth: "true",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: "/topics/all",
            registration_tokens: [token],
        }),
    });

    return new Response(null, { headers, status: r.ok ? 200 : 500 });
}

async function createToken(serviceAccount: any, aud: string, scope?: string) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pem = serviceAccount.private_key;
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length - 1);
    // base64 decode the string to get the binary data
    const binaryDer = Buffer.from(pemContents, "base64");

    const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
                name: "SHA-256",
            },
        },
        false,
        ["sign"]
    );

    const header = Buffer.from(
        JSON.stringify({
            alg: "RS256",
            typ: "JWT",
            kid: serviceAccount.private_key_id,
        })
    ).toString("base64url");

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const payload = Buffer.from(
        JSON.stringify({
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            aud,
            ...(scope ? { scope } : {}),
            exp,
            iat,
        })
    ).toString("base64url");

    const textEncoder = new TextEncoder();
    const inputArrayBuffer = textEncoder.encode(`${header}.${payload}`);
    const outputArrayBuffer = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, privateKey, inputArrayBuffer);
    const signature = Buffer.from(outputArrayBuffer).toString("base64url");

    return `${header}.${payload}.${signature}`;
}

async function authToken(env: Env, serviceAccount: any) {
    const cachedRaw = await env.cache.get("authToken", "arrayBuffer");
    if (cachedRaw) {
        const cached = decode(cachedRaw) as any;
        if (Date.now() < cached.expires) {
            return cached.token;
        }
    }

    const jwt = await createToken(serviceAccount, "https://oauth2.googleapis.com/token", "https://www.googleapis.com/auth/cloud-platform");
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
            Host: "oauth2.googleapis.com",
        },
        body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
    });

    // Grab the JSON from the response
    const oauth = (await response.json()) as any;
    const token = oauth.access_token;

    if (token) {
        await env.cache.put("authToken", encode({ token, expires: Date.now() + oauth.expires_in * 1000 }));
    }

    return oauth.access_token;
}

export function splitTitle(post: string) {
    const titleRegex = /^# (.+)/m.exec(post);

    if (titleRegex) {
        return [titleRegex[1], post.slice(titleRegex.index + titleRegex[0].length).trim()];
    }

    return [null, post];
}
