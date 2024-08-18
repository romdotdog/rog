import { Component } from "solid-js";
import ArticleView from "./ArticleView";

const content = `
-   doggy for exploiting a bug that I had already fixed, but not pushed
-   fabricio for testing my markdown
-   joshA for urging me to add an autosave feature
-   alex for making the precursor to rog
-   you for visiting rog
`;

const Thanks: Component = () => {
    return <ArticleView title="Thanks" content={content} author="rom" timestamp={1722903290871} />;
};

export default Thanks;
