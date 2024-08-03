import { Show, Suspense, type Component } from "solid-js";
import style from "./ArticleView.module.css";
import Author from "./Author";
import { createAsync, useLocation, useNavigate, useParams } from "@solidjs/router";
import { getPost } from "./API";
import { formatKey, splitTitle } from "./utils";
import Markdown from "./Markdown";

const ArticleView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation<{ back: boolean }>();
    const goBack = () => location.state?.back ? navigate(-1) : navigate("/", { state: { back: true } });

    getPost(params.hash).then(console.log);
    const post = createAsync(() => 
        getPost(params.hash).then(post => {
            const [title, content] = splitTitle(post.content);
            return {
                title,
                content,
                author: post.author,
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
                <Author timestamp={post()!.timestamp} author={post()!.author} keyChecksum={post()!.keyChecksum} class={style.author} />
                <Markdown value={post()!.content} />
            </div>
        </Show>
    );
};

export default ArticleView;
