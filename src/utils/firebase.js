import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBNDQ1AFffA1gBH6tqNSzWMS9Gk5v4V-8M",
  authDomain: "appointment-notification-cc54d.firebaseapp.com",
  projectId: "appointment-notification-cc54d",
  storageBucket: "appointment-notification-cc54d.appspot.com",
  messagingSenderId: "106572713774",
  appId: "1:106572713774:web:fd87d0ea8dfa87c9bf74bf",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = "BD9gstUBvsx9KLRfJI7htCdgn0L4DFMKPs6_sAGJsaarvQlZYxRXV4ato3xa5Kt7wbIUsx_EtM4AT6ZZClwXDrM";

export const requestFCMToken = async () => {
  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("✅ FCM Token:", token);
      return token;
    }
  } catch (err) {
    console.error("❌ FCM error:", err);
  }
};

export const listenForForegroundMessages = (callback) => {
  return onMessage(messaging, callback);
};
