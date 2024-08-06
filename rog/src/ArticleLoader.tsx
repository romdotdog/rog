import { Show, type Component } from "solid-js";
import { createAsync, useLocation, useNavigate, useParams } from "@solidjs/router";
import { getPost } from "./API";
import { formatKey, splitTitle, toHex } from "./utils";
import ArticleView from "./ArticleView";

const ArticleLoader: Component = () => {
    const params = useParams();

    const post = createAsync(() =>
        getPost(params.hash).then(post => {
            console.log(post);
            const [title, content] = splitTitle(post.content);
            return {
                hash: params.hash,
                title: title,
                content,
                author: post.author,
                replyingTo: post.replyingTo && toHex(post.replyingTo),
                replyingToPreview: post.replyingToPreview,
                keyChecksum: formatKey(post.key.slice(0, 5)),
                timestamp: post.timestamp,
                participating: post.participating,
            };
        }),
    );

    return (
        <Show when={post()} fallback={<p>loading...</p>}>
            <ArticleView {...post()!} />
        </Show>
    );
};

export default ArticleLoader;
