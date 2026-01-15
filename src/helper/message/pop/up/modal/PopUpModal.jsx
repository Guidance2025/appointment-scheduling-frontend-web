import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../../../../../css/PopUpModal.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const PopUpModal = ({ type, title, message, onClose }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const handleConfirm = () => {
    if (!isLoading && onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isConfirm) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className={`popup-modal popup-${type}`}>
        {!isConfirm && (
          <button
            className="popup-close-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        )}

        <div className="popup-icon-container">
          {getIcon()}
        </div>

        <div className="popup-content">
          {title && <h3 className="popup-title">{title}</h3>}
          {message && <p className="popup-message">{message}</p>}
        </div>

        {isConfirm ? (
          <div className="popup-actions">
            <button
              className="popup-btn popup-btn-cancel"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              className={`popup-btn popup-btn-confirm popup-btn-${type}`}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        ) : (
          <div className="popup-actions">
            <button
              className={`popup-btn popup-btn-single popup-btn-${type}`}
              onClick={onClose}
              disabled={isLoading}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};