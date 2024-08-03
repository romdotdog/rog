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
            p.keyChecksum, 
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
    const keyChecksum = decodedData.key.slice(0, 4);

    const r = /^[^#\s](?:.{0,499}?\n|.{499})/m.exec(decodedData.content);
    const preview = decodedData.content.substring(0, r ? r.index + r[0].length : 500).trim();

    // Save post to DB
    const { results } = await env.DB.prepare(
        `INSERT OR IGNORE INTO posts (hash, author, content, preview, keyChecksum, key, signature, timestamp, replyingTo)
		            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
        .bind(
            hashBin,
            author,
            content,
            preview,
            keyChecksum,
            decodedData.key,
            decodedData.signature,
            timestamp,
            decodedData.replyingTo ?? null
        )
        .run();

    if (results.length > 0) {
        await env.DB.prepare(
            `WITH RECURSIVE Ancestors AS (
                -- Start with the initial post (the one just inserted)
                SELECT
                    hash,
                    replyingTo,
                    participating
                FROM posts
                WHERE hash = ?

                UNION ALL

                -- Recursively select the ancestors
                SELECT
                    p.hash,
                    p.replyingTo,
                    p.participating + 1 -- Increment participating count
                FROM posts p
                INNER JOIN Ancestors a ON p.hash = a.replyingTo
            )

            UPDATE posts
            SET participating = Ancestors.participating
            FROM Ancestors
            WHERE posts.hash = Ancestors.hash;`
        )
            .bind(hashBin)
            .run();
    }

    return new Response(hashBin, { headers: msgpack });
}

export function splitTitle(post: string) {
    const titleRegex = /^# (.+)/m.exec(post);

    if (titleRegex) {
        return [titleRegex[1], post.slice(titleRegex.index + titleRegex[0].length).trim()];
    }

    return [null, post];
}
