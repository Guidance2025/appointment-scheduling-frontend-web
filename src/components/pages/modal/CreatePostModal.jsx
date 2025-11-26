import React from "react";
import "../../../css/CreatePostModal.css";

const CreatePostModal = ({
  newPost,
  setNewPost,
  categories,    
  creating,
  handleCreate,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={handleCreate}>
          <div className="modal-header">
            <h3 className="modal-title">Create Post</h3>
          </div>

          <div className="modal-body">
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <input
                className="filter-input"
                list="category-list"
                placeholder="Type: Announcement, Quote, Events"
                value={newPost.category_name || ""}
                onChange={(e) =>
                  setNewPost((s) => ({
                    ...s,
                    category_name: e.target.value, 
                    category_id: ""               
                  }))
                }
                required
              />
              <datalist id="category-list">
                <option value="Announcement" />
                <option value="Quote" />
                <option value="Events" />
              </datalist>
              <small className="hint">
                You can type a new or existing category. It will be saved automatically.
              </small>
            </div>

            <div className="filter-group">
              <label className="filter-label">Section (optional)</label>
              <select
                className="filter-select"
                value={newPost.section_id}
                onChange={(e) => setNewPost((s) => ({ ...s, section_id: e.target.value }))}
              >
                <option value="">All Sections</option>
                <option value="1">ROCS - BSIT-701</option>
                <option value="2">ELITES - BSIT-701</option>
                <option value="3">MERX - BSIT-701</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Content</label>
              <textarea
                className="filter-input"
                rows={4}
                placeholder="Write your post..."
                value={newPost.post_content}
                onChange={(e) => setNewPost((s) => ({ ...s, post_content: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="filter-button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="filter-button primary" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
