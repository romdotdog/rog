import { Show, type Component } from "solid-js";
import style from "./ArticlePreview.module.css";
import Author from "./Author";
import { useNavigate } from "@solidjs/router";
import Markdown from "./Markdown";
import ReplyingTo from "./ReplyingTo";
import { glow, splitTitle } from "./utils";

const ArticlePreview: Component<{
    preview: string;
    replyingTo?: string;
    replyingToPreview?: string;
    author: string;
    keyChecksum: string;
    hash: string;
    timestamp: number;
    participating: number;
    i: number;
}> = props => {
    const navigate = useNavigate();
    const onClick = () => navigate(`/${props.hash}`, { state: { back: true } });

    const [title, content] = splitTitle(props.preview);

    return (
        <article onClick={onClick} class={style.post} style={`--i: ${props.i};`}>
            <div class={style.content}>
                <h2 style={`${glow(props.participating, props.timestamp)}`}>{title ?? "[unknown title]"}</h2>
                <Show when={props.replyingTo}>
                    <ReplyingTo replyingTo={props.replyingTo!} replyingToPreview={props.replyingToPreview!} />
                </Show>
                <Author
                    timestamp={props.timestamp}
                    author={props.author}
                    keyChecksum={props.keyChecksum}
                    participating={props.participating}
                    class=""
                />
                <Markdown value={content.replace(/\.*$/, "…")} />
            </div>
        </article>
    );
};

export default ArticlePreview;
