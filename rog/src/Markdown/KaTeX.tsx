import katex from "katex";
import type { Component } from "solid-js";
import "katex/dist/katex.min.css";

export const BlockMath: Component<{ value: string }> = ({ value }) => {
    let ref = <div /> as HTMLDivElement;

    katex.render(value, ref, {
        throwOnError: false
    });

    return ref;
}

export const InlineMath: Component<{ value: string }> = ({ value }) => {
    let ref = <span /> as HTMLSpanElement;

    katex.render(value, ref, {
        throwOnError: false
    });

    return ref;
}