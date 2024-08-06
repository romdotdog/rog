import { getToken, getMessaging, onMessage, Messaging } from "firebase/messaging";
import workerUrl from "./pushWorker?worker&url";
import app from "./pushFirebase";
import { subUnsubNotifications } from "./API";
import { Navigator, useNavigate } from "@solidjs/router";
import { Component } from "solid-js";

export const notifsAvailable = "serviceWorker" in navigator;

let registration: ServiceWorkerRegistration | undefined = undefined;
let messaging: Messaging | undefined = undefined;
let navigate: Navigator | undefined = undefined;

if (notifsAvailable) {
    messaging = getMessaging(app);
    try {
        registration = await navigator.serviceWorker.register(workerUrl, { type: "module" });
    } catch (e) {
        console.error("push worker registration failed:", e);
    }

    onMessage(messaging, payload => {
        console.log("Received foreground message ", payload);
        const notification = new Notification(payload.notification?.title ?? "No title", {
            body: payload.notification?.body ?? "No body",
        });

        notification.onclick = () => {
            const data = payload.data;
            if (navigate && data && data.hash) {
                navigate(`/${data.hash}`, { state: { back: true } });
                notification.close();
            }
        };
    });
}

export const wrapPush: <T>(component: Component<T>) => Component<T> = component => props => {
    navigate = useNavigate();
    return component(props);
};

export async function toggleSubscription() {
    if (registration === undefined || messaging === undefined) {
        return;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBKEY;
    if (vapidKey === undefined) {
        return console.warn("missing VAPID_PUBKEY env variable");
    }

    if (Notification.permission === "denied") {
        return console.warn("notification permission denied");
    }

    const subscribed = localStorage.getItem("subscribed") === "true";
    try {
        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });

        const ok = await subUnsubNotifications(token, !subscribed);
        if (ok) localStorage.setItem("subscribed", String(!subscribed));
    } catch (error) {
        console.error("an error occurred while retrieving the token", error);
    }
}
