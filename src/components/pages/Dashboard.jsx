import React, { useEffect, useState } from "react";
import "../../css/Dashboard.css";
import CreatePostModal from "./modal/CreatePostModal";
import { normalizePost, normalizeCategory } from "../../utils/normalize";
import {POSTS_URL,QUOTE_OF_THE_DAY_URL,CATEGORIES_URL, DELETE_POST_URL,} from "../../api/api";

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newPost, setNewPost] = useState({category_name: "",category_id: "",post_content: "",section_id: "",section_code: "",});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem("jwtToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const isQuoteCategory = (name) => (name || "").trim().toLowerCase() === "quote";

  const uniqueById = (arr) => {
    const seen = new Set();
    return (arr || []).filter((item) => {
      const id = item?.post_id ?? item?.postId;
      if (id == null || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const loadPosts = async (headers) => {
    const res = await fetch(`${POSTS_URL}?limit=20`, { headers });
    if (!res.ok) throw new Error(`Posts ${res.status}`);
    const data = await res.json();
    const normalized = (data || []).map(normalizePost);
    const postsOnly = normalized.filter((p) => !isQuoteCategory(p.category_name));
    setPosts(uniqueById(postsOnly));
  };

  const loadQuote = async (headers) => {
    const res = await fetch(QUOTE_OF_THE_DAY_URL, { headers });
    if (!res.ok) return setQuoteOfTheDay(null);
    const q = await res.json();
    setQuoteOfTheDay(
      q && Object.keys(q).length
        ? {
            post_content: q.POST_CONTENT ?? q.post_content,
            posted_date: q.POSTED_DATE ?? q.posted_date,
            section_name: q.SECTION_NAME ?? q.section_name,
            organization: q.ORGANIZATION ?? q.organization,
          }
        : null
    );
  };

  const loadCategories = async (headers) => {
    const res = await fetch(CATEGORIES_URL, { headers });
    if (!res.ok) return setCategories([]);
    const data = await res.json();
    setCategories((data || []).map(normalizeCategory));
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const headers = { "Content-Type": "application/json", ...authHeaders() };
        await Promise.all([loadPosts(headers), loadQuote(headers), loadCategories(headers)]);
        setSelectedIds(new Set());
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating) return; // guard against double-click/press

    const categoryName = (newPost.category_name || "").trim();
    const postContent = (newPost.post_content || "").trim();
    if (!categoryName || !postContent) {
      alert("Category and content are required.");
      return;
    }

    setCreating(true);
    try {
      const headers = { "Content-Type": "application/json", ...authHeaders() };
      const payload = {
        categoryName,
        sectionId: newPost.section_id ? Number(newPost.section_id) : null,
        postContent,
      };

      const res = await fetch(POSTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Create failed:", res.status, res.statusText, msg);
        alert(`Failed to create post: ${res.status} ${res.statusText}\n${msg}`);
        return;
      }

      // Reload from backend (source of truth)
      await Promise.all([loadPosts(headers), loadQuote(headers)]);

      setNewPost({
        category_name: "",
        category_id: "",
        post_content: "",
        section_id: "",
        section_code: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Create error:", err);
      alert(`Failed to create post:\n${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (post_id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(post_id) ? next.delete(post_id) : next.add(post_id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected post(s)? This cannot be undone.`)) return;

    setBulkDeleting(true);
    const headers = { ...authHeaders() };
    const failed = [];

    try {
      for (const id of ids) {
        const url = DELETE_POST_URL(id);
        try {
          const res = await fetch(url, { method: "DELETE", headers });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`DELETE ${url}: ${res.status} ${res.statusText} ${text}`);
            failed.push(id);
          } else {
            setPosts((prev) => prev.filter((p) => p.post_id !== id));
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        } catch (err) {
          console.error(`DELETE ${url} error:`, err);
          failed.push(id);
        }
      }

      if (failed.length > 0) {
        alert(`Some posts could not be deleted (${failed.length}).`);
      }
      } finally {
    setBulkDeleting(false);
    try {
      const headers = { ...authHeaders() };
      await loadPosts(headers); 
    } catch (e) {
      console.error("Reload after delete failed:", e);
    }
  }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h2 className="page-title"></h2>
        <div className="header-actions" style={{ display: "flex", gap: "8px" }}>
          <button
            className="filter-button secondary"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || bulkDeleting}
          >
            {bulkDeleting ? "Deleting..." : selectedIds.size > 0 ? `Delete (${selectedIds.size})` : "Delete"}
          </button>
          <button className="filter-button primary" onClick={() => setIsModalOpen(true)}>
            + Create
          </button>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="post-card highlight-card">
        <div className="post-header">
          <span className="post-author">Quote of the Day</span>
          {quoteOfTheDay?.posted_date && (
            <span className="post-date">{new Date(quoteOfTheDay.posted_date).toLocaleString()}</span>
          )}
        </div>
        {(quoteOfTheDay?.section_name || quoteOfTheDay?.organization) && (
          <div className="quote-meta">
            {quoteOfTheDay?.organization && <span>{quoteOfTheDay.organization}</span>}
            {quoteOfTheDay?.organization && quoteOfTheDay?.section_name ? <span> • </span> : null}
            {quoteOfTheDay?.section_name && <span>{quoteOfTheDay.section_name}</span>}
          </div>
        )}
        <div className="post-content">
          <p className="quote-text">{quoteOfTheDay?.post_content || "No quote set today."}</p>
        </div>
      </div>

      {/* Posts */}
      <div className="post-card">
        <div className="post-header">
          <span className="post-author">Posts</span>
        </div>
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner" /> Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-message">No posts yet.</div>
        ) : (
          <ul className="feed-list">
            {posts.map((p) => (
              <li key={p.post_id} className="feed-item">
                <div className="feed-header">
                  <div className="feed-meta">
                    <span className="feed-author">{p.posted_by || "Guidance Staff"}</span>
                    <span className="feed-category">{p.category_name}</span>
                    {p.section_name && <span className="feed-section">• {p.section_name}</span>}
                  </div>
                  <span className="post-date">
                    {p.posted_date ? new Date(p.posted_date).toLocaleString() : ""}
                  </span>
                </div>
                <div className="feed-content">
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.post_id)}
                      onChange={() => toggleSelect(p.post_id)}
                      aria-label={`Select post ${p.post_id}`}
                    />
                    <span>{p.post_content}</span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreatePostModal
        newPost={newPost}
        setNewPost={setNewPost}
        categories={categories}
        creating={creating}
        handleCreate={handleCreate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;