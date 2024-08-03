import type { Component } from "solid-js";
import style from "./Author.module.css";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Author: Component<{ author: string, keyChecksum: string, class: string, timestamp: number }> = ({ author, keyChecksum, class: className, timestamp }) => {
    return (
        <div class={`${style.author} ${className}`}>
            by <b>{author}</b> <code>({keyChecksum})</code>
            <div class={`robust ${style.extraneous}`}><span>{dayjs(timestamp).fromNow()}</span><span class={style.dot} /><span>0 participating</span></div>
        </div>
    );
};

export default Author;
