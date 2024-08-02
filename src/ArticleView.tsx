import { Show, Suspense, type Component } from "solid-js";
import style from "./ArticleView.module.css";
import Author from "./Author";
import { createAsync, useNavigate, useParams } from "@solidjs/router";
import { getPost } from "./API";
import { formatKey, splitTitle } from "./utils";

const ArticleView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    getPost(params.hash).then(console.log);
    const post = createAsync(() => 
        getPost(params.hash).then(post => {
            const [title, content] = splitTitle(post.content);
            return {
                title,
                content,
                author: post.author,
                keyChecksum: formatKey(post.key.slice(0, 4)),
            };
        })
    );

    console.log(post);
    
    return (
        <Show when={post()} fallback={<p>loading...</p>}>
            <div class={style.container}>
                <a onClick={goBack} href="#" class={style.back}>
                    ⟵ back
                </a>
                <h1>{post()!.title}</h1>
                <Author author={post()!.author} keyChecksum={post()!.keyChecksum} class={style.author} />
                {post()!.content.split("\n\n").map((p) => <p>{p}</p>)}
            </div>
        </Show>
    );
};

export default ArticleView;
