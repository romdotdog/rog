/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import app from "./pushFirebase";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const messaging = getMessaging(app);
onBackgroundMessage(messaging, payload => {
    console.log("Received background message ", payload);
    self.registration.showNotification(payload.notification?.title ?? "No title", {
        body: payload.notification?.body ?? "No body",
        data: payload.data,
    });
});

self.addEventListener("notificationclick", e => {
    e.notification.close();
    e.notification.data;
    self.clients.openWindow(new URL(`/${e.notification.data.hash}`, self.location.origin));
});
