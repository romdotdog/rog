export function splitTitle(post: string) {
    const titleRegex = /^# (.+)/m.exec(post);

    if (titleRegex) {
        return [titleRegex[1], post.slice(titleRegex.index + titleRegex[0].length).trim()];
    }

    return ["[unknown title]", post];
}

export function formatKey(key: Uint8Array) {
    return toHex(key).slice(0, 7);
}

export function toHex(buffer: Uint8Array) {
    return Array.prototype.map.call(buffer, x => x.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string) {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
}
