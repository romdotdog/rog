import type { Component } from "solid-js";
import { A } from "@solidjs/router";
import style from "./ReplyingTo.module.css";
import { splitTitle } from "./utils";

const ReplyingTo: Component<{ replyingTo: string, replyingToPreview: string }> = ({ replyingTo, replyingToPreview }) => {
    const [title] = splitTitle(replyingToPreview);
    return (
        <h5 class={style.replyingTo}>
            Re: <A href={`/${replyingTo}`}>{title}</A>
        </h5>
    );
};

export default ReplyingTo;
