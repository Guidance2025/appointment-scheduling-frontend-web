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
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

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
      setSelectedSections([]);
      setSelectAll(false);
      setNewPost((prev) => ({ ...prev, sectionNames: [] }));
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

  const handleSelectAllChange = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    
    if (isChecked) {
      setSelectedSections([]);
      setNewPost((prev) => ({ ...prev, sectionNames: [] }));
    }
  };

  const handleSectionToggle = (sectionName) => {
    setSelectAll(false);
    
    setSelectedSections((prev) => {
      const isCurrentlySelected = prev.includes(sectionName);
      let updatedSections;
      
      if (isCurrentlySelected) {
        updatedSections = prev.filter((s) => s !== sectionName);
      } else {
        updatedSections = [...prev, sectionName];
      }
      
      setNewPost((prevPost) => ({ 
        ...prevPost, 
        sectionNames: updatedSections 
      }));
      
      return updatedSections;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPost.category_name || !newPost.post_content.trim()) {
      showError("Missing Fields", "Please fill in category and content");
      return;
    }

    if (isSectionRequired && !selectAll && selectedSections.length === 0) {
      showError("Missing Section", "Please select at least one section or choose 'All'");
      return;
    }

    try {
      await handleCreate(e);
      showSuccess(
        "Post Created!",
        "Your post has been successfully created and published to the feed.",
        3000
      );
      setSelectedSections([]);
      setSelectAll(false);
    } catch (err) {
      showError(
        "Failed to Create Post",
        err.message || "An unexpected error occurred. Please try again."
      );
    }
  };

  const handleCancel = () => {
    setSelectedSections([]);
    setSelectAll(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-post-modal-card">
        <div className="modal-header-row">
          <h2>Create New Post</h2>
          <button type="button" className="close-btn" onClick={handleCancel}>
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

              {isSectionRequired && (
                <div className="form-group">
                  <label>
                    Target Sections <span className="required">*</span>
                  </label>
                  
                  <div className="section-select-all">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                        disabled={loadingSections}
                      />
                      <span>All Sections</span>
                    </label>
                  </div>

                  {!selectAll && (
                    <div className="section-checkbox-container">
                      {loadingSections ? (
                        <div className="loading-text">Loading sections...</div>
                      ) : (
                        availableSections.map((section, i) => (
                          <label key={i} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedSections.includes(section)}
                              onChange={() => handleSectionToggle(section)}
                            />
                            <span>{section}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  <small className="hint">
                    {selectAll
                      ? "Post will be sent to all sections"
                      : selectedSections.length > 0
                      ? `Selected: ${selectedSections.join(", ")}`
                      : "Select sections to target"}
                  </small>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Content <span className="required">*</span>
              </label>
              <textarea
                rows={3}
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
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={creating}
            >
              Cancel
            </button>
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