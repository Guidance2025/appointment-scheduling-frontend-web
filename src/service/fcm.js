import { REGISTER_FCM_TOKEN } from "../../constants/api";
import { requestForToken } from "../utils/firebase";

export async function registerFcmToken(userId) {
  try {
    if (!("Notification" in window)) {
      console.warn(" This browser does not support notifications");
      return false;
    }

    // Get current permission status
    const currentPermission = Notification.permission;
    console.log(" Current notification permission:", currentPermission);

    // If permission not granted yet, REQUEST IT (this shows the popup)
    if (currentPermission === "default") {
      console.log(" Requesting notification permission...");
      const permission = await Notification.requestPermission();
      
      if (permission === "denied") {
        console.warn(" User denied notification permission");
        return false;
      } else if (permission !== "granted") {
        console.warn(" User dismissed notification permission");
        return false;
      }
      console.log("✅ User granted notification permission!");
    } else if (currentPermission === "denied") {
      console.warn("Notifications are blocked. User must enable in browser settings.");
      return false;
    }

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