import { initializeApp } from "firebase/app";

export default initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE));
