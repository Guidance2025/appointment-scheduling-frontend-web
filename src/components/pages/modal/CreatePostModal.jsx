import React from "react";
import "../../../css/CreatePostModal.css";

const CreatePostModal = ({
  newPost,
  setNewPost,
  categories,
  creating,
  handleCreate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={handleCreate}>
          <div className="modal-header">
            <h3>Create New Post</h3>
            <button type="button" className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={newPost.category_name}
                onChange={(e) =>
                  setNewPost({ ...newPost, category_name: e.target.value })
                }
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="content">Post Content</label>
              <textarea
                id="content"
                value={newPost.post_content}
                onChange={(e) =>
                  setNewPost({ ...newPost, post_content: e.target.value })
                }
                placeholder="Enter your post content..."
                rows={4}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="section">Section (Optional)</label>
              <input
                id="section"
                type="text"
                value={newPost.section_id}
                onChange={(e) =>
                  setNewPost({ ...newPost, section_id: e.target.value })
                }
                placeholder="Enter section ID if targeting specific section"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;