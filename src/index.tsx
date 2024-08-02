/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Route, RoutePreloadFuncArgs, Router } from "@solidjs/router";

import "./index.css";
import "./scrollbar.css";
import { getFeed, getPost } from "./API";

const root = document.getElementById("root");

if ((import.meta as any).env.DEV && !(root instanceof HTMLElement)) {
    throw new Error("Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?");
}

const App = lazy(() => import("./App"));
const ArticleView = lazy(() => import("./ArticleView"));

function preloadFeed() {
    void getFeed();
}

function preloadPost({ params }: RoutePreloadFuncArgs) {
    void getPost(params.hash);
}

render(
    () => (
        <Router>
            <Route path="/" component={App} preload={preloadFeed} />
            <Route path="/:hash" component={ArticleView} preload={preloadPost} />
        </Router>
    ),
    root!,
);
