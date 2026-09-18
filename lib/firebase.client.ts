'use client';

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
const analytics: Analytics | null = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth: Auth = getAuth(app);

let messaging: Messaging | null = null;

const initMessaging = async () => {
  if (typeof window === "undefined") return null;
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser");
      return null;
    }
    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging initialization failed:", error);
    return null;
  }
};

if (typeof window !== "undefined") {
  initMessaging()
    .then((messagingInstance) => {
      messaging = messagingInstance;
    })
    .catch((error) => {
      console.warn("Failed to initialize Firebase Messaging:", error);
    });
}

if (typeof window !== "undefined") {
  auth.languageCode = "en";
}

export { app, analytics, auth, messaging, getToken, onMessage, initMessaging };
