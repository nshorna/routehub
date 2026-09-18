// Configure via your Firebase web app settings (do not commit production keys).
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY || "REPLACE_ME",
  authDomain: self.__FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: self.__FIREBASE_PROJECT_ID || "your-project",
  storageBucket: self.__FIREBASE_STORAGE_BUCKET || "your-project.firebasestorage.app",
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: self.__FIREBASE_APP_ID || "1:000000000000:web:xxxxxxxx",
  measurementId: self.__FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
