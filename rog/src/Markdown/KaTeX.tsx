import katex from "katex";
import { createEffect, type Component } from "solid-js";
import "katex/dist/katex.min.css";

export const BlockMath: Component<{ value: string }> = props => {
    let ref = (<div />) as HTMLDivElement;

    createEffect(() => {
        katex.render(props.value, ref, {
            throwOnError: false,
        });
    });

    return ref;
};

export const InlineMath: Component<{ value: string }> = props => {
    let ref = (<span />) as HTMLSpanElement;

    createEffect(() => {
        katex.render(props.value, ref, {
            throwOnError: false,
        });
    });

    return ref;
};
