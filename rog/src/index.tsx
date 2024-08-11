/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import { wrapPush } from "./push";

import "./index.css";
import "./scrollbar.css";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/700-italic.css";

import "@fontsource/eb-garamond";
import "@fontsource/source-code-pro";

const root = document.getElementById("root");

if ((import.meta as any).env.DEV && !(root instanceof HTMLElement)) {
    throw new Error("Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?");
}

const App = lazy(() => import("./App"));
const About = lazy(() => import("./About"));
const Thanks = lazy(() => import("./Thanks"));
const ArticleLoader = lazy(() => import("./ArticleLoader"));

render(
    () => (
        <Router>
            <Route path="/" component={wrapPush(App)} />
            <Route path="/about" component={wrapPush(About)} />
            <Route path="/thanks" component={wrapPush(Thanks)} />
            <Route path="/:hash" component={wrapPush(ArticleLoader)} />
        </Router>
    ),
    root!
);
