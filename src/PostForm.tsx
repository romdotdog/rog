import { Component, createSignal } from "solid-js";
import style from "./PostForm.module.css";
import { publishPost } from "./API";

const PostForm: Component = () => {
    const [collapsed, setCollapsed] = createSignal(true);
    const [words, setWords] = createSignal(0);

    const toggleCollapse = (e: MouseEvent) => {
        setCollapsed(!collapsed());
        e.preventDefault();
    };

    const updateWords = (e: InputEvent) => {
        setWords((e.target as HTMLInputElement).value.split(" ").filter(x => x.trim()).length);
    };

    const submit = (e: SubmitEvent) => {
        const form = e.target as HTMLFormElement;
        const author = form.displayname.value;
        publishPost(author.trim() || "Anonymous", form.post.value);
        e.preventDefault();
    };

    return (
        <>
            <a href="#" onClick={toggleCollapse} class={style.postBtn}>
                {collapsed() ? "Post" : "Collapse"}
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

                    <button type="submit" class={style.submitBtn}>
                        Submit
                    </button>
                </form>
            </div>
        </>
    );
};

export default PostForm;
