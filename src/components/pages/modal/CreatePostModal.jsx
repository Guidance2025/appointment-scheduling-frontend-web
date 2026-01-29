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
  const { showSuccess, showError } = usePopUp();
  const [availableSections, setAvailableSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const FIXED_CATEGORIES = [
    { id: 1, name: "Announcement" },
    { id: 2, name: "Events" },
    { id: 3, name: "Quote" },
  ];

  const isSectionRequired =
    newPost.category_name === "Announcement" ||
    newPost.category_name === "Events";

  useEffect(() => {
    if (isSectionRequired) {
      fetchSections();
    } else {
      setAvailableSections([]);
      setNewPost((prev) => ({ ...prev, section_id: null }));
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

    try {
      await handleCreate(e);
      showSuccess(
        "Post Created!",
        "Your post has been successfully created and published to the feed.",
        3000
      );
    } catch (err) {
      showError(
        "Failed to Create Post",
        err.message || "An unexpected error occurred. Please try again."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header-row">
          <h2>Create New Post</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <div className="form-row two-col">
              <div className="form-group">
                <label>
                  Category <span className="required">*</span>
                </label>
                <select
                  value={newPost.category_name || ""}
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      category_name: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled hidden>
                    Select Category
                  </option>
                  {FIXED_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Target Section{" "}
                  {isSectionRequired && <span className="required">*</span>}
                </label>
                <select
                  value={newPost.section_id || ""}
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      section_id: e.target.value === "all" ? null : e.target.value || null,  // Map "all" to null
                    })
                  }
                  disabled={!isSectionRequired || loadingSections}
                  required={isSectionRequired}
                >
                  <option value="" disabled hidden>
                    Select Section
                  </option>
                  {isSectionRequired && (
                    <option value="all">All</option>  
                  )}
                  {availableSections.map((section, i) => (
                    <option key={i} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
                {!isSectionRequired && (
                  <small className="hint">
                    Target section is not required for this category
                  </small>
                )}
                {isSectionRequired && (
                  <small className="hint">
                    Choose "All" for global visibility or select a specific section
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                Content <span className="required">*</span>
              </label>
              <textarea
                rows={5}
                value={newPost.post_content}
                onChange={(e) =>
                  setNewPost({
                    ...newPost,
                    post_content: e.target.value,
                  })
                }
                required
              />
              <small>
                {500 - newPost.post_content.length} characters remaining
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
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