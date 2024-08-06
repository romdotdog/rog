import { createSignal, Show, type Component } from "solid-js";
import { A } from "@solidjs/router";
import { isSubscribed, notifsAvailable, toggleSubscription } from "./push";

const SubUnsub: Component = () => {
    const [subscribed, setSubscribed] = createSignal(isSubscribed());
    const [loading, setLoading] = createSignal(false);

    const subUnsub = async () => {
        if (!notifsAvailable || loading()) return;

        setLoading(true);
        try {
            await toggleSubscription();
        } catch (e) {
            console.error("push subscription failed:", e);
        }
        setLoading(false);
        setSubscribed(isSubscribed());
    };

    return (
        <Show when={notifsAvailable}>
            <A href="#" onClick={subUnsub}>
                {loading() ? "loading..." : subscribed() ? "unsubscribe" : "subscribe"}
            </A>
        </Show>
    );
};

export default SubUnsub;
