import type { Component } from "solid-js";
import style from "./Footer.module.css";

const Footer: Component = () => {
    return (
        <footer class={style.footer}>
            &copy; 2024 <a href="https://rom.dog/">rom</a>
        </footer>
    );
};

export default Footer;
