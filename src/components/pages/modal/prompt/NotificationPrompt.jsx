import { useState, useEffect } from "react";
import "../../../../css/NotificationPrompt.css";

function NotificationPrompt({ userId, onClose }) {
  const [permissionState, setPermissionState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [browser, setBrowser] = useState("chrome");

  useEffect(() => {
    // Detect browser
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) setBrowser("firefox");
    else if (ua.includes("Safari") && !ua.includes("Chrome")) setBrowser("safari");
    else if (ua.includes("Edg")) setBrowser("edge");
    else setBrowser("chrome");

    console.log("🔔 NotificationPrompt mounted");
    console.log("🔔 Notification supported:", "Notification" in window);
    console.log("🔔 Permission:", "Notification" in window ? Notification.permission : "N/A");

    if (!("Notification" in window)) {
      // Not supported — just redirect
      onClose?.();
      return;
    }

    const current = Notification.permission;

    if (current === "granted") {
      // Already granted — redirect immediately
      console.log("🔔 Already granted, redirecting...");
      onClose?.();
      return;
    }

    if (current === "denied") {
      // Show manual browser instructions
      console.log("🔔 Permission denied, showing instructions...");
      setPermissionState("denied");
      return;
    }

    // "default" — always show the prompt
    // GabayLogin already controls when this component mounts
    // so we don't need to check notificationPromptDismissed here
    console.log("🔔 Permission default, showing prompt...");
    setPermissionState("default");

  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      console.log("🔔 User responded:", permission);

      if (permission === "granted") {
        console.log("✅ Notifications enabled!");
        try {
          const { registerFcmToken } = await import("../../../../service/fcm");
          await registerFcmToken(userId);
        } catch (fcmError) {
          console.error("FCM registration error:", fcmError);
        }
        onClose?.();
      } else if (permission === "denied") {
        // User clicked Block — show manual instructions
        setPermissionState("denied");
      } else {
        // User dismissed the browser dialog
        onClose?.();
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notificationPromptDismissed", "true");
    onClose?.();
  };

  const BROWSER_STEPS = {
    chrome: [
      'Click the 🔒 lock icon in the address bar',
      'Find "Notifications" in the dropdown',
      'Change it from "Block" to "Allow"',
      'Refresh the page and log in again',
    ],
    edge: [
      'Click the 🔒 lock icon in the address bar',
      'Click "Permissions for this site"',
      'Find "Notifications" → set to "Allow"',
      'Refresh the page and log in again',
    ],
    firefox: [
      'Click the 🔒 lock icon in the address bar',
      'Click "Connection Secure" → "More Information"',
      'Go to the "Permissions" tab',
      'Find "Send Notifications" → uncheck "Use Default" → set to "Allow"',
      'Refresh the page and log in again',
    ],
    safari: [
      'Go to Safari → Settings (or Preferences)',
      'Click the "Websites" tab',
      'Select "Notifications" from the left sidebar',
      'Find this website → set to "Allow"',
      'Refresh the page and log in again',
    ],
  };

  if (!permissionState) return null;

  // ── Denied — show manual instructions ──────────────────────────────────
  if (permissionState === "denied") {
    const steps = BROWSER_STEPS[browser] || BROWSER_STEPS.chrome;
    const browserLabel = browser.charAt(0).toUpperCase() + browser.slice(1);

    return (
      <div className="notification-prompt-overlay">
        <div className="notification-prompt-card notification-prompt-card--denied">
          <div className="notification-prompt-icon">🔕</div>
          <h3>Notifications Are Blocked</h3>
          <p>You'll need to manually allow notifications in your browser settings.</p>
          <div className="notification-prompt-steps">
            <p className="notification-prompt-steps-label">
              How to enable ({browserLabel}):
            </p>
            <ol>
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="notification-prompt-buttons">
            <button className="btn-dismiss" onClick={handleDismiss}>
              I'll do it later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt-card">
        <div className="notification-prompt-icon">🔔</div>
        <h3>Enable Notifications</h3>
        <p>Get notified about appointment updates and reminders</p>
        <div className="notification-prompt-buttons">
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="btn-enable"
          >
            {isLoading ? "Enabling..." : "Enable Notifications"}
          </button>
          <button onClick={handleDismiss} className="btn-dismiss">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPrompt;