import type { Component } from "solid-js";
import { parse } from "./Parser";
import { marked } from "marked";
import style from "./Markdown.module.css";
import markedKatex from "./markedKatex";

// Thanks to https://github.com/sibiraj-s/marked-react for the base code

marked.use(markedKatex());

const Markdown: Component<{ value: string }> = props => {
    return <div class={style.markdown}>{parse(marked.lexer(props.value))}</div>;
};

export default Markdown;
