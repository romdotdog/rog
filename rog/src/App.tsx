import type { Component } from "solid-js";
import ArticlePreview from "./ArticlePreview";
import Header from "./Header";
import Footer from "./Footer";
import PostForm from "./PostForm";
import style from "./App.module.css";
import { createAsync } from "@solidjs/router";
import { getFeed } from "./API";
import { formatKey, splitTitle, toHex } from "./utils";

const App: Component = () => {
    const feed = createAsync(() => getFeed());

    return (
        <div class={style.container}>
            <Header />

            <PostForm />

            <main>
                {feed()?.map((post, i) => {
                    const [title, content] = splitTitle(post.preview);
                    return <ArticlePreview title={title} author={post.author} keyChecksum={formatKey(post.keyChecksum)} preview={content} hash={toHex(post.hash)} timestamp={post.timestamp} i={i} />
                })}
            </main>

            <Footer />
        </div>
    );
};

export default App;
