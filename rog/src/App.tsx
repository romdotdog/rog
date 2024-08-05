import type { Component } from "solid-js";
import ArticlePreview from "./ArticlePreview";
import Header from "./Header";
import Footer from "./Footer";
import PostForm from "./PostForm";
import style from "./App.module.css";
import { createAsync } from "@solidjs/router";
import { getFeed } from "./API";
import { formatKey, toHex } from "./utils";

const App: Component = () => {
    const feed = createAsync(() => getFeed().then(r => (console.log(r), r)));

    return (
        <div class={style.container}>
            <Header />

            <PostForm actionName="Post" />

            <main>
                {feed()?.map((post, i) => {
                    return <ArticlePreview replyingTo={post.replyingTo && toHex(post.replyingTo)} replyingToPreview={post.replyingToPreview} author={post.author} keyChecksum={formatKey(post.keyChecksum)} preview={post.preview} hash={toHex(post.hash)} timestamp={post.timestamp} participating={post.participating} i={i} />
                })}
            </main>

            <Footer />
        </div>
    );
};

export default App;
