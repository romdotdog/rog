import { Component, createSignal } from "solid-js";
import style from "./PostForm.module.css";
import { publishPost } from "./API";
import { useNavigate } from "@solidjs/router";

const PostForm: Component<{ actionName: string, replyingTo?: string }> = (props) => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = createSignal(true);
    const [words, setWords] = createSignal(0);
    const [error, setError] = createSignal<string | null>(null);
    const [working, setWorking] = createSignal(false);

    const toggleCollapse = (e: MouseEvent) => {
        setCollapsed(!collapsed());
        e.preventDefault();
    };

    const updateWords = (e: InputEvent) => {
        setWords((e.target as HTMLInputElement).value.split(" ").filter(x => x.trim()).length);
    };

    const submit = async (e: SubmitEvent) => {
        const form = e.target as HTMLFormElement;
        const author = form.displayname.value;
        e.preventDefault();

        try {
            setWorking(true);
            const hash = await publishPost(author.trim() || "Anonymous", form.post.value.trim(), props.replyingTo);
            navigate(`/${hash}`, { state: { back: true } });
        } catch(e) {
            setWorking(false);
            setError((e as any).message)
        }
    };

    return (
        <>
            <a href="#" onClick={toggleCollapse} class={style.postBtn}>
                {collapsed() ? props.actionName : "Collapse"}
            </a>

            <div class={style.formContainer} style={{ display: collapsed() ? "none" : "block" }}>
                <form onsubmit={submit}>
                    <div class={style.formGroup}>
                        <label for="displayname">Display Name</label>
                        <input type="text" id="displayname" name="displayname" placeholder="Anonymous" />
                    </div>

                    <div class={`${style.formGroup} ${style.required}`}>
                        <label for="post">Post</label>
                        <textarea onInput={updateWords} required id="post" name="post" placeholder="What's on your mind?"></textarea>
                        <small class={words() > 100 ? style.success : style.fail}>{words()}/100 words</small>
                    </div>

                    <button type="submit" class={style.submitBtn} disabled={working()}>
                        {working() ? "Computing..." : "Submit"}	
                    </button>

                    {error() && <div class={style.error}>{error()}</div>}
                </form>
            </div>
        </>
    );
};

export default PostForm;
