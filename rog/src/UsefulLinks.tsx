import { type Component } from "solid-js";
import style from "./UsefulLinks.module.css";
import SubUnsub from "./SubUnsub";
import { A } from "@solidjs/router";

const UsefulLinks: Component = () => {
    return (
        <div class={`robust ${style.container}`}>
            <A href="/about">about</A>
            <SubUnsub />
            <a href="https://github.com/users/romdotdog/projects/6">roadmap</a>
        </div>
    );
};

export default UsefulLinks;
