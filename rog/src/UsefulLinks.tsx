import { type Component } from "solid-js";
import style from "./UsefulLinks.module.css";
import SubUnsub from "./SubUnsub";

const UsefulLinks: Component = () => {
    return (
        <span class={`robust ${style.container}`}>
            <SubUnsub />
        </span>
    );
};

export default UsefulLinks;
