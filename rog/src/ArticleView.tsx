import { type Component } from "solid-js";
import style from "./ArticleView.module.css";
import Author from "./Author";
import { useLocation, useNavigate } from "@solidjs/router";
import { glow } from "./utils";
import Markdown from "./Markdown";
import PostForm from "./PostForm";
import ReplyingTo from "./ReplyingTo";

interface Props {
    hash?: string;
    title?: string | null;
    content: string;
    author: string;
    replyingTo?: string;
    replyingToPreview?: string;
    keyChecksum?: string;
    participating?: number;
    timestamp: number;
}

const ArticleView: Component<Props> = post => {
    const navigate = useNavigate();
    const location = useLocation<{ back: boolean }>();
    const goBack = () => (location.state?.back ? navigate(-1) : navigate("/", { state: { back: true } }));

    return (
        <div class={style.container}>
            <a onClick={goBack} href="#" class={style.back}>
                ⟵ back
            </a>
            <h1 class={style.title} style={post.participating ? glow(post.participating, post.timestamp) : ""}>
                {post.title ?? "[unknown title]"}
            </h1>
            {post.replyingTo && <ReplyingTo replyingTo={post.replyingTo} replyingToPreview={post.replyingToPreview!} />}
            <Author
                timestamp={post.timestamp}
                author={post.author}
                keyChecksum={post.keyChecksum}
                participating={post.participating}
                class={style.author}
            />
            <Markdown value={post.content} />
            {post.hash && <PostForm actionName="Reply" replyingTo={post.hash} />}
        </div>
    );
};

export default ArticleView;
