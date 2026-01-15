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
  const [confirmation, setConfirmation] = useState(null);

  const showNotification = useCallback((type, title, message, duration = 3000) => {
    setNotification({ type, title, message });

    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  const showSuccess = (title, message, duration) => 
    showNotification("success", title, message, duration);
  
  const showError = (title, message, duration) => 
    showNotification("error", title, message, duration);
  
  const showWarning = (title, message, duration) => 
    showNotification("warning", title, message, duration);
  
  const showInfo = (title, message, duration) => 
    showNotification("info", title, message, duration);

  const hideNotification = () => setNotification(null);

  const showConfirm = useCallback((config) => {
    const {
      type = "warning",
      title = "Confirm Action",
      message = "Are you sure you want to proceed?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      onConfirm,
      onCancel
    } = config;

    setConfirmation({
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      isLoading: false
    });
  }, []);

  const hideConfirm = useCallback(() => {
    if (confirmation?.onCancel) {
      confirmation.onCancel();
    }
    setConfirmation(null);
  }, [confirmation]);

  const handleConfirm = useCallback(async () => {
    if (!confirmation?.onConfirm) {
      setConfirmation(null);
      return;
    }

    setConfirmation(prev => ({ ...prev, isLoading: true }));

    try {
      const result = confirmation.onConfirm();
      
      if (result instanceof Promise) {
        await result;
      }

      setConfirmation(null);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      
      setConfirmation(prev => ({ ...prev, isLoading: false }));
      
      showError(
        'Action Failed',
        error.message || 'An error occurred while processing your request.',
        5000
      );
    }
  }, [confirmation, showError]);

  return (
    <PopUpModalContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideNotification,
        showConfirm,
        hideConfirm
      }}
    >
      {children}

      {notification && (
        <PopUpModal
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          isConfirm={false}
        />
      )}

      {confirmation && (
        <PopUpModal
          type={confirmation.type}
          title={confirmation.title}
          message={confirmation.message}
          onClose={hideConfirm}
          onConfirm={handleConfirm}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          isConfirm={true}
          isLoading={confirmation.isLoading}
        />
      )}
    </PopUpModalContext.Provider>
  );
};