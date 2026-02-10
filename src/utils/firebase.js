import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBNDQ1AFffA1gBH6tqNSzWMS9Gk5v4V-8M",
  authDomain: "appointment-notification-cc54d.firebaseapp.com",
  projectId: "appointment-notification-cc54d",
  storageBucket: "appointment-notification-cc54d.appspot.com",
  messagingSenderId: "106572713774",
  appId: "1:106572713774:web:fd87d0ea8dfa87c9bf74bf",
  measurementId: "G-KM3T6ZDKXB"
};

const VAPID_KEY = "BD9gstUBvsx9KLRfJI7htCdgn0L4DFMKPs6_sAGJsaarvQlZYxRXV4ato3xa5Kt7wbIUsx_EtM4AT6ZZClwXDrM";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("⚠️ This browser does not support notifications");
      return null;
    }

    if (Notification.permission !== "granted") {
      console.warn("⚠️ Permission not granted:", Notification.permission);
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready; // Wait for SW to be ready

    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (fcmToken) {
      console.log("✅ FCM Token (Web):", fcmToken);
      return fcmToken;
    } else {
      console.error("❌ No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("❌ An error occurred while retrieving token:", error);
    return null;
  }
};

export const listenForForegroundMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    if (callback) callback(payload);
  });
};