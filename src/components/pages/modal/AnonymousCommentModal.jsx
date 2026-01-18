import React, { useState } from "react";
import "../../../css/AnonymousCommentModal.css";

const AnonymousCommentModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }

    await onSubmit(commentText.trim());
    setCommentText("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-comment">
      <div className="modal-card-comment">
        <div className="modal-header-comment">
          <h3>Add Anonymous Comment</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-comment">
            <p className="anonymous-notice">
              💡 Your comment will be posted anonymously. Your identity will not be revealed.
            </p>
            <div className="form-group">
              <label htmlFor="comment">Your Comment</label>
              <textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts anonymously..."
                rows={4}
                maxLength={500}
                required
              />
              <small className="char-count">
                {commentText.length} / 500 characters
              </small>
            </div>
          </div>

          <div className="modal-footer-comment">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnonymousCommentModal;
