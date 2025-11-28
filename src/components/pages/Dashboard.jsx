import React, { useEffect, useState } from "react";
import "../../css/Dashboard.css";
import CreatePostModal from "./modal/CreatePostModal";
import { normalizePost, normalizeCategory } from "../../utils/normalize";
import { POSTS_URL, QUOTE_OF_THE_DAY_URL, CATEGORIES_URL, DELETE_POST_URL } from "../../api/api";

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    category_name: "",
    category_id: "",
    post_content: "",
    section_id: ""
  });
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // case/space-insensitive category check
  const isQuoteCategory = (name) =>
    (name || "").toString().trim().toLowerCase() === "quote";

  // Reload helpers
  const reloadPosts = async (headers) => {
    const res = await fetch(`${POSTS_URL}?limit=20`, { headers });
    if (!res.ok) throw new Error(`Reload posts failed ${res.status}`);
    const data = await res.json();
    const normalized = (data || []).map(normalizePost);
    const postsOnly = normalized.filter((p) => !isQuoteCategory(p.category_name));
    setPosts(postsOnly);
  };

  const reloadQuote = async (headers) => {
    const res = await fetch(QUOTE_OF_THE_DAY_URL, { headers });
    if (!res.ok) return;
    const q = await res.json();
    const quote = q && Object.keys(q).length
      ? {
          post_content: q.POST_CONTENT ?? q.post_content,
          posted_date:  q.POSTED_DATE  ?? q.posted_date,
          section_name: q.SECTION_NAME ?? q.section_name,
          organization: q.ORGANIZATION ?? q.organization
        }
      : null;
    setQuoteOfTheDay(quote);
  };

  useEffect(() => {
  const loadData = async () => {
    try {
      const [postsRes, quoteRes, catsRes] = await Promise.all([
        fetch(`${POSTS_URL}?limit=20`),
        fetch(QUOTE_OF_THE_DAY_URL),
        fetch(CATEGORIES_URL),
      ]);

      const postsDataRaw = postsRes.ok ? await postsRes.json() : [];
      const quoteDataRaw = quoteRes.ok ? await quoteRes.json() : {};
      const catsDataRaw  = catsRes.ok  ? await catsRes.json()  : [];

      // Normalize and split
      const normalized = (postsDataRaw || []).map(normalizePost);
      const postsOnly  = normalized.filter((p) => !isQuoteCategory(p.category_name));
      setPosts(postsOnly);

      // Build a single quote object then set it ONCE
      let quote = null;

      if (quoteDataRaw && Object.keys(quoteDataRaw).length) {
        // from backend endpoint
        quote = {
          post_content: quoteDataRaw.POST_CONTENT ?? quoteDataRaw.post_content,
          posted_date:  quoteDataRaw.POSTED_DATE  ?? quoteDataRaw.posted_date,
          section_name: quoteDataRaw.SECTION_NAME ?? quoteDataRaw.section_name,
          organization: quoteDataRaw.ORGANIZATION ?? quoteDataRaw.organization
        };
      } else {
        // fallback: latest Quote from the merged list (if any)
        const quotesOnly = normalized.filter((p) => isQuoteCategory(p.category_name));
        if (quotesOnly.length) {
          const latestQuote = [...quotesOnly].sort((a, b) => {
            const da = new Date(a.posted_date || 0).getTime();
            const db = new Date(b.posted_date || 0).getTime();
            return db - da;
          })[0];
          if (latestQuote) {
            quote = {
              post_content: latestQuote.post_content,
              posted_date:  latestQuote.posted_date,
              section_name: latestQuote.section_name,
              organization: latestQuote.organization
            };
          }
        }
      }

      setQuoteOfTheDay(quote);

      setCategories((catsDataRaw || []).map(normalizeCategory));
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);

  const handleCreate = async (e) => {
  e.preventDefault();

  const catName = (newPost.category_name || "").trim();
  const content = (newPost.post_content || "").trim();
  if (!catName || !content) {
    alert("Category and content are required.");
    return;
  }

  setCreating(true);
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(localStorage.getItem("jwtToken")
        ? { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` }
        : {})
    };

    const payload = {
      categoryName: catName,
      sectionId: newPost.section_id ? Number(newPost.section_id) : null,
      postContent: content
    };

    const createRes = await fetch(POSTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!createRes.ok) {
      const msg = await createRes.text().catch(() => "");
      console.error("Create POST failed:", createRes.status, createRes.statusText, msg);
      alert(`Failed to create post: ${createRes.status} ${createRes.statusText}\n${msg}`);
      return;
    }

    // Immediate UX
    if (isQuoteCategory(catName)) {
      setQuoteOfTheDay({
        post_content: content,
        posted_date: new Date().toISOString(),
        section_name: null,
        organization: null
      });
    } else {
      setPosts((prev) => [
        {
          post_id: Date.now(),
          post_content: content,
          posted_date: new Date().toISOString(),
          category_name: catName,
          section_name: null,
          organization: null,
          posted_by: "You"
        },
        ...prev
      ]);
    }

    // Refresh both containers from backend
    const [postsRes, quoteRes] = await Promise.all([
      fetch(`${POSTS_URL}?limit=20`, { headers }),
      fetch(QUOTE_OF_THE_DAY_URL,   { headers })
    ]);

    if (postsRes.ok) {
      const raw = await postsRes.json();
      const normalized = (raw || []).map(normalizePost);
      const postsOnly  = normalized.filter((p) => !isQuoteCategory(p.category_name));
      setPosts(postsOnly);
    }
    if (quoteRes.ok) {
      const q = await quoteRes.json();
      if (q && Object.keys(q).length) {
        setQuoteOfTheDay({
          post_content: q.POST_CONTENT ?? q.post_content,
          posted_date:  q.POSTED_DATE  ?? q.posted_date,
          section_name: q.SECTION_NAME ?? q.section_name,
          organization: q.ORGANIZATION ?? q.organization
        });
      }
    }

    // Full reset
    setNewPost({ category_name: "", category_id: "", post_content: "", section_id: "" });
    setIsModalOpen(false);
  } catch (err) {
    console.error("Create post failed:", err);
    alert(`Failed to create post:\n${err.message}`);
  } finally {
    setCreating(false);
  }
};

  const toggleSelect = (post_id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(post_id)) next.delete(post_id);
      else next.add(post_id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const confirmed = window.confirm(`Delete ${ids.length} selected post(s)? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(DELETE_POST_URL(id), { method: "DELETE" });
          return { id, ok: res.ok };
        })
      );

      const deletedIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      const failedCount = results.length - deletedIds.size;

      setPosts((prev) => prev.filter((p) => !deletedIds.has(p.post_id)));

      setSelectedIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });

      if (failedCount > 0) {
        alert(`Some posts could not be deleted (${failedCount}).`);
      }
    } catch (e) {
      console.error("Bulk delete failed:", e);
      alert("Failed to delete selected posts");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (post_id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(DELETE_POST_URL(post_id), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setPosts((prev) => prev.filter((p) => p.post_id !== post_id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(post_id);
        return next;
      });
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete post");
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
            aria-label="Delete selected posts"
            title="Delete selected posts"
          >
            {bulkDeleting
              ? "Deleting..."
              : selectedIds.size > 0
              ? `Delete (${selectedIds.size})`
              : "Delete"}
          </button>

          <button className="filter-button primary" onClick={() => setIsModalOpen(true)}>
            + Create
          </button>
        </div>
      </div>

      {/* Quote Card */}
      <div className="post-card highlight-card">
        <div className="post-header">
          <span className="post-author">Quote of the Day</span>
          {quoteOfTheDay?.posted_date && (
            <span className="post-date">{new Date(quoteOfTheDay.posted_date).toLocaleString()}</span>
          )}
        </div>

        {/* NEW: show section/organization meta for quote */}
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

      {/* Posts List (non-Quote only) */}
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
