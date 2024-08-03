import type { Component } from "solid-js";
import style from "./Author.module.css";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Author: Component<{ author: string, keyChecksum: string, class: string, timestamp: number }> = ({ author, keyChecksum, class: className, timestamp }) => {
    return (
        <h3 class={`${style.author} ${className}`}>
            by {author} <code>({keyChecksum})</code>, {dayjs(timestamp).fromNow()}
        </h3>
    );
};

export default Author;
