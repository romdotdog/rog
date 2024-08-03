import type { Component } from "solid-js";
import style from "./ArticlePreview.module.css";
import Author from "./Author";
import { useNavigate } from "@solidjs/router";
import Markdown from "./Markdown";
import ReplyingTo from "./ReplyingTo";
import { splitTitle } from "./utils";

const ArticlePreview: Component<{ preview: string, replyingTo?: string, replyingToPreview?: string, author: string, keyChecksum: string, hash: string, timestamp: number, i: number }> = ({ replyingTo, replyingToPreview, author, keyChecksum, preview, hash, timestamp, i }) => {
    const navigate = useNavigate();
    const onClick = () => navigate(`/${hash}`, { state: { back: true } });

    const [title, content] = splitTitle(preview);
    
    return (
        <article onClick={onClick} class={style.post} style={`--i: ${i};`}>
            <div class={style.content}>
                <h2>{title}</h2>
                {replyingTo && <ReplyingTo replyingTo={replyingTo} replyingToPreview={replyingToPreview!} /> }
                <Author timestamp={timestamp} author={author} keyChecksum={keyChecksum} class="" />
                <Markdown value={content.replace(/\.*$/, "…")} />
            </div>
        </article>
    );
};

export default ArticlePreview;
