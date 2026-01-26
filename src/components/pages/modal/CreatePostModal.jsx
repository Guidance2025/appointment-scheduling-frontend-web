import React, { useState, useEffect } from "react";
import "../../../css/CreatePostModal.css";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";
import { fetchAllSectionsByStudent } from "../../../service/post";

const CreatePostModal = ({
  newPost,
  setNewPost,
  categories,
  sections,
  creating,
  handleCreate,
  isOpen,
  onClose,
}) => {
  const {showSuccess, showError } = usePopUp();
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [availableSections, setAvailableSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    // Show section selector only for Announcements and Events
    if (newPost.category_name === "Announcement" || newPost.category_name === "Events") {
      fetchSections();
      setShowSectionSelector(true);
    } else {
      setShowSectionSelector(false);
      setAvailableSections([]);
      setNewPost(prev => ({ ...prev, section_id: null }));  
    }
  }, [newPost.category_name]); 

  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const sectionList = await fetchAllSectionsByStudent();
      setAvailableSections(sectionList);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.category_name || !newPost.post_content.trim()) {
      showError("Missing Fields", "Please fill in category and content");
      return;
    }
    
    // Validate that section is selected for Events and Announcements
    if ((newPost.category_name === "Events" || newPost.category_name === "Announcement") && 
        !newPost.section_id) {
      showError("Missing Section", "Please select a section for this post type");
      return;
    }
    
    try {
      await handleCreate(e);
      showSuccess("Post Created!", "Your post has been successfully created and published to the feed.", 3000);
    } catch (err) {
      showError("Failed to Create Post", err.message || "An unexpected error occurred. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <form onSubmit={handleSubmit}>
          <h2 className="modal-header">Create New Post</h2>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                value={newPost.category_name}
                onChange={(e) => {
                  setNewPost({ ...newPost, category_name: e.target.value });
                }}
                required
              >
                <option value="">-- Select Category --</option>
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.category_id || cat.categoryId} value={cat.category_name || cat.categoryName}>
                      {cat.category_name || cat.categoryName}
                    </option>
                  ))
                ) : (
                  <option disabled>No categories available</option>
                )}
              </select>
              <small className="help-text">
                Select post type: Events, Questions, Quote, or Announcement
              </small>
            </div>

            {/* Section Selection (only for Announcements and Events) */}
            {showSectionSelector && (
              <div className="form-group">
                <label htmlFor="section">
                  Target Section <span className="required">*</span>
                </label>
                <select
                  id="section"
                  value={newPost.section_id || ""}
                  onChange={(e) =>
                    setNewPost({ ...newPost, section_id: e.target.value || null })
                  }
                  required
                  disabled={loadingSections}
                >
                  <option value="">
                    {loadingSections ? "Loading sections..." : "-- Select Section --"}
                  </option>
                  {availableSections.length > 0 ? (
                    availableSections.map((section,index) => (
                      <option key={section || index} value={section}>
                        {section}
                      </option>
                    ))
                  ) : (
                    !loadingSections && <option disabled>No sections available</option>
                  )}
                </select>
                <small className="help-text">
                  Select the section that should receive this post
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="content">
                Content <span className="required">*</span>
              </label>
              <textarea
                id="content"
                value={newPost.post_content}
                onChange={(e) =>
                  setNewPost({ ...newPost, post_content: e.target.value })
                }
                placeholder={
                  newPost.category_name === "Quote"
                    ? "Enter the quote..."
                    : newPost.category_name === "Questions"
                    ? "Enter your question..."
                    : newPost.category_name === "Announcement"
                    ? "Enter announcement details..."
                    : "Enter post content..."
                }
                rows={5}
                required
              />
              <small className="help-text">
                {500 - newPost.post_content.length} characters remaining
              </small>
            </div>

            {/* Category Info */}
            {newPost.category_name && (
              <div className="category-info">
                <strong>📌 Post Type:</strong> {newPost.category_name}
                {showSectionSelector && newPost.section_id && (
                  <div>
                    <strong>👥 Visible to:</strong> {newPost.section_id}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={creating || !newPost.category_name || !newPost.post_content.trim()}
            >
              {creating ? "Creating..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;