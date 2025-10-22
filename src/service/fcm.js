import { REGISTER_FCM_TOKEN } from "../../constants/api";
import { requestForToken } from "../components/utils/firebase";

export async function registerFcmToken(userId) {
  try {
    console.log("🔄 Registering FCM token for userId:", userId);

    const fcmToken = await requestForToken();
    if (!fcmToken) {
      console.warn(" No FCM token available");
      return false;
    }

    const response = await fetch(REGISTER_FCM_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        fcmToken,
        deviceType: "WEB",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(" FCM registration failed:", errorText);
      return false;
    }

    console.log(" FCM token registered successfully!");
    return true;
  } catch (error) {
    console.error(" Error registering FCM token:", error);
    return false;
  }
}
