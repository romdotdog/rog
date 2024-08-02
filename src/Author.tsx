import type { Component } from "solid-js";
import style from "./Author.module.css";

const Author: Component<{ author: string, keyChecksum: string, class: string }> = ({ author, keyChecksum, class: className }) => {
    return (
        <h3 class={`${style.author} ${className}`}>
            by {author} <code>({keyChecksum})</code>
        </h3>
    );
};

export default Author;
