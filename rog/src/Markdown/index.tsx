import type { Component } from "solid-js";
import { parse } from "./Parser";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";

// Thanks to https://github.com/sibiraj-s/marked-react for the base code

marked.use(markedKatex());

const Markdown: Component<{ value: string }> = ({ value }) => {
    const tokens = marked.lexer(value);
    return parse(tokens);
};

export default Markdown;
