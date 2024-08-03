import type { Component } from "solid-js";
import style from "./ArticlePreview.module.css";
import Author from "./Author";
import { useNavigate } from "@solidjs/router";
import Markdown from "./Markdown";

const ArticlePreview: Component<{ title: string, author: string, keyChecksum: string, preview: string, hash: string, timestamp: number, i: number }> = ({ title, author, keyChecksum, preview, hash, timestamp, i }) => {
    const navigate = useNavigate();
    const onClick = () => navigate(`/${hash}`, { state: { back: true } });
    
    return (
        <article onClick={onClick} class={style.post} style={`--i: ${i};`}>
            <div class={style.content}>
                <h2>{title}</h2>
                <Author timestamp={timestamp} author={author} keyChecksum={keyChecksum} class="" />
                <Markdown value={preview.replace(/\.*$/, "…")} />
            </div>
        </article>
    );
};

export default ArticlePreview;
