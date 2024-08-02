import type { Component } from "solid-js";
import style from "./Header.module.css";

const Header: Component = () => {
    return (
        <header class={style.header}>
            <h1>rog – rom's blog</h1>
            <h2>community blog; long-form posting and response only</h2>
        </header>
    );
};

export default Header;
