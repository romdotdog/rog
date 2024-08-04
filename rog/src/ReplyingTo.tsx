import type { Component } from "solid-js";
import { A } from "@solidjs/router";
import style from "./ReplyingTo.module.css";
import { splitTitle } from "./utils";

const ReplyingTo: Component<{ replyingTo: string, replyingToPreview: string }> = ({ replyingTo, replyingToPreview }) => {
    const [title] = splitTitle(replyingToPreview);
    return (
        <div class={`robust ${style.replyingTo}`}>
            Re: <A onClick={e => e.stopPropagation()} href={`/${replyingTo}`}>{title}</A>
        </div>
    );
};

export default ReplyingTo;
