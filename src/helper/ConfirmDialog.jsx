import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import '../css/ConfirmDialog.css';

/**
 * Reusable confirmation dialog component
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Called when dialog closes
 * @param {function} onConfirm - Called when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} type - Dialog type: 'warning', 'info', 'success', 'error' (default: 'warning')
 * @param {boolean} isLoading - Shows loading state on confirm button
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} className="dialog-icon warning" />;
      case 'info':
        return <Info size={24} className="dialog-icon info" />;
      case 'success':
        return <CheckCircle size={24} className="dialog-icon success" />;
      case 'error':
        return <XCircle size={24} className="dialog-icon error" />;
      default:
        return <AlertTriangle size={24} className="dialog-icon warning" />;
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

  return (
    <div className="confirm-dialog-overlay" onClick={handleCancel}>
      <div className="confirm-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          {getIcon()}
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button
            className="confirm-dialog-btn cancel-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-dialog-btn confirm-btn ${type}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;