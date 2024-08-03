import { Show, type Component } from "solid-js";
import style from "./ArticleView.module.css";
import Author from "./Author";
import { createAsync, useLocation, useNavigate, useParams } from "@solidjs/router";
import { getPost } from "./API";
import { formatKey, fromHex, splitTitle, toHex } from "./utils";
import Markdown from "./Markdown";
import PostForm from "./PostForm";
import ReplyingTo from "./ReplyingTo";

const ArticleView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation<{ back: boolean }>();
    const goBack = () => location.state?.back ? navigate(-1) : navigate("/", { state: { back: true } });

    const post = createAsync(() => 
        getPost(params.hash).then(post => {
            const [title, content] = splitTitle(post.content);
            return {
                title,
                content,
                author: post.author,
                replyingTo: post.replyingTo && toHex(post.replyingTo),
                replyingToPreview: post.replyingToPreview,
                keyChecksum: formatKey(post.key.slice(0, 4)),
                timestamp: post.timestamp
            };
        })
    );
    
    return (
        <Show when={post()} fallback={<p>loading...</p>}>
            <div class={style.container}>
                <a onClick={goBack} href="#" class={style.back}>
                    ⟵ back
                </a>
                <h1 class={style.title}>{post()!.title}</h1>
                {post()!.replyingTo && <ReplyingTo replyingTo={post()!.replyingTo!} replyingToPreview={post()!.replyingToPreview!} /> }
                <Author timestamp={post()!.timestamp} author={post()!.author} keyChecksum={post()!.keyChecksum} class={style.author} />
                <Markdown value={post()!.content} />
                <PostForm actionName="Reply" replyingTo={params.hash} />
            </div>
        </Show>
    );
};

export default ArticleView;
