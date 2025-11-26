import { createContext, useCallback, useContext, useState } from "react";
import { PopUpModal } from "../modal/PopUpModal";  

const PopUpModalContext = createContext();

export const usePopUp = () => {
  const ctx = useContext(PopUpModalContext);
  if (!ctx) throw new Error("usePopUp must be used inside PopUpModalProvider");
  return ctx;
};

export const PopUpModalProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, title, message, duration = 3000) => {
    setNotification({ type, title, message });

    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  const showSuccess = (t, m, d) => showNotification("success", t, m, d);
  const showError = (t, m, d) => showNotification("error", t, m, d);
  const showWarning = (t, m, d) => showNotification("warning", t, m, d);
  const hideNotification = () => setNotification(null);

  return (
    <PopUpModalContext.Provider
      value={{ showSuccess, showError, showWarning, hideNotification }}
    >
      {children}

      {notification && (
        <PopUpModal
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </PopUpModalContext.Provider>
  );
};
