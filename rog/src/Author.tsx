import type { Component } from "solid-js";
import style from "./Author.module.css";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Author: Component<{ author: string; keyChecksum?: string; class: string; participating?: number; timestamp: number }> = props => {
    return (
        <div class={`${style.author} ${props.class}`}>
            <span class={style.by}>
                by <b>{props.author}</b> {props.keyChecksum && <code>({props.keyChecksum})</code>}
            </span>
            <div class={`robust ${style.extraneous}`}>
                <span>{dayjs(props.timestamp).fromNow()}</span>
                {props.participating && (
                    <>
                        <span class={style.dot} />
                        <span>{props.participating} participating</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default Author;
