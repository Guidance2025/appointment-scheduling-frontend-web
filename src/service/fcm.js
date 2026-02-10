import { REGISTER_FCM_TOKEN } from "../../constants/api";
import { requestFCMToken } from "../utils/firebase";

export async function registerFcmToken(userId) {
  try {
    if (!("Notification" in window)) {
      console.warn("⚠️ This browser does not support notifications");
      return false;
    }

    if (Notification.permission !== "granted") {
      console.warn("⚠️ Notification permission is not granted:", Notification.permission);
      return false;
    }

    const fcmToken = await requestFCMToken();

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