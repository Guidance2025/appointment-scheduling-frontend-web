import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../../../../../css/PopUpModal.css';

/**
 * PopUpModal Component - Beautiful notification and confirmation modal
 * @param {string} type - Modal type: 'success', 'error', 'warning', 'info'
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {function} onClose - Called when modal closes
 * @param {boolean} isConfirm - If true, shows confirm/cancel buttons
 * @param {function} onConfirm - Called when user confirms (only for confirm type)
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {boolean} isLoading - Shows loading state on confirm button
 */
export const PopUpModal = ({
  type = 'info',
  title,
  message,
  onClose,
  isConfirm = false,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const getIcon = () => {
    const iconProps = { size: 28, className: 'popup-icon' };
    
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