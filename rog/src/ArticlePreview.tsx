import type { Component } from "solid-js";
import style from "./ArticlePreview.module.css";
import Author from "./Author";
import { useNavigate } from "@solidjs/router";

const ArticlePreview: Component<{ title: string, author: string, keyChecksum: string, preview: string, hash: string, i: number }> = ({ title, author, keyChecksum, preview, hash, i }) => {
    const navigate = useNavigate();
    const onClick = () => navigate(`/${hash}`, { state: { back: true } });
    
    return (
        <article onClick={onClick} class={style.post} style={`--i: ${i};`}>
            <div class={style.content}>
                <h2>{title}</h2>
                <Author author={author} keyChecksum={keyChecksum} class="" />
                <p>{preview.replace(/\.*$/, "…")}</p>
            </div>
        </article>
    );
};

export default ArticlePreview;
