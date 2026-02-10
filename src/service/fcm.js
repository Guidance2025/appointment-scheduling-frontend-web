import { REGISTER_FCM_TOKEN } from "../../constants/api";
import { requestForToken } from "../utils/firebase";

export async function registerFcmToken(userId) {
  try {
    if (!("Notification" in window)) {
      console.warn("⚠️ This browser does not support notifications");
      return false;
    }

    // By the time this is called from NotificationPrompt,
    // permission is already granted. But we guard here just in case.
    if (Notification.permission !== "granted") {
      console.warn("⚠️ Notification permission is not granted:", Notification.permission);
      return false;
    }

    const fcmToken = await requestForToken();

    if (!fcmToken) {
      console.warn("⚠️ No FCM token available");
      return false;
    }

    const jwtToken = localStorage.getItem("jwtToken");

    const response = await fetch(REGISTER_FCM_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
      },
      body: JSON.stringify({
        userId,
        fcmToken,
        deviceType: "WEB",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ FCM registration failed:", errorText);
      return false;
    }

    console.log("✅ FCM token registered successfully!");
    return true;

  } catch (error) {
    console.error("❌ Error registering FCM token:", error);
    return false;
  }
}