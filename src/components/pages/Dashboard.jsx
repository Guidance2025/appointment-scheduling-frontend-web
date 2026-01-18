import React, { useEffect, useState } from "react";
import "../../css/Dashboard.css";
import CreatePostModal from "./modal/CreatePostModal";
import PostCard from "./PostCard";
import { normalizePost, normalizeCategory } from "../../utils/normalize";
import { POSTS_URL, POST_BY_ID_URL, QUOTE_OF_THE_DAY_URL, LATEST_POSTS_URL,
  DELETE_POST_URL,
  UPDATE_POST_URL,
  CATEGORIES_URL,
} from "../../../constants/api";
import {
  fetchLatestPosts,
  fetchQuoteOfTheDay,
  fetchCategories,
  createPost,
  deletePost,
} from "../../service/post";

const toJson = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
};

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [newPost, setNewPost] = useState({
    category_name: "",
    post_content: "",
    section_ids: [],
    section_code: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isGuidanceStaff, setIsGuidanceStaff] = useState(false);

  const loadPosts = async () => {
    const data = await fetchLatestPosts();
    const normalized = (data || []).map(normalizePost);
    setPosts(normalized);
  };

  const loadQuote = async () => {
    const q = await fetchQuoteOfTheDay();
    setQuoteOfTheDay(
      q && Object.keys(q).length
        ? {
            post_content: q.post_content || q.POST_CONTENT,
            posted_date: q.posted_date || q.POSTED_DATE,
            section_name: q.section_name || q.SECTION_NAME,
            organization: q.organization || q.ORGANIZATION,
          }
        : null
    );
  };

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories((data || []).map(normalizeCategory));
  };

  const loadSections = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch("http://localhost:8080/api/sections", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.warn("Failed to load sections, status:", res.status);
        return setSections([]);
      }
      const data = await res.json();
      console.log("[Dashboard] Raw sections from API:", data);
      const normalized = (data || []).map((s) => ({
        id: s.section_id || s.id,
        code: s.section_code || s.code,
        name: s.section_name || s.name,
      }));
      console.log("[Dashboard] Normalized sections:", normalized);
      setSections(normalized);
    } catch (e) {
      console.error("Load sections failed:", e);
    }
  };

  const checkUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isStaff = user.role === "GUIDANCE_STAFF" || user.role === "guidance_staff" || user.role === "ADMIN" || user.role === "admin";
      setIsGuidanceStaff(isStaff);
    } catch (e) {
      console.error("Check user role failed:", e);
      setIsGuidanceStaff(true); // Show buttons for testing
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        checkUserRole();
        await Promise.all([loadPosts(), loadQuote(), loadCategories(), loadSections()]);
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.post_id !== postId));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete post: " + e.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating) return;

    const postContent = (newPost.post_content || "").trim();
    if (!newPost.category_name || !postContent) {
      alert("Category and content are required.");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("jwtToken");
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      console.log("Creating post with category:", newPost.category_name);
      console.log("Token exists:", !!token);

      await createPost({
        categoryName: newPost.category_name.trim(),
        sectionIds: newPost.section_ids || [],
        postContent,
      });

      await Promise.all([loadPosts(), loadQuote()]);

      setNewPost({
        category_name: "",
        post_content: "",
        section_ids: [],
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="header-subtitle">
            {isGuidanceStaff ? "Guidance Staff Posts Management" : "Student Updates Feed"}
          </p>
        </div>
        <button
          onClick={() => {
            console.log("[Dashboard] Opening CreatePostModal with sections:", sections);
            // Reset form when opening modal
            setNewPost({
              category_name: "",
              post_content: "",
              section_ids: [],
              section_code: "",
            });
            setIsModalOpen(true);
          }}
          className="btn-create-post"
          disabled={loading || creating}
          title="Create a new post"
        >
          <span className="btn-icon">+</span>
          <span className="btn-text">Create Post</span>
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading posts...</p>
        </div>
      )}

      {quoteOfTheDay && (
        <div className="quote-of-the-day">
          <h3>Quote of the Day</h3>
          <p>{quoteOfTheDay.post_content}</p>
          {quoteOfTheDay.section_name && (
            <small>— {quoteOfTheDay.section_name}</small>
          )}
        </div>
      )}

      <div className="posts-container">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.post_id}
              post={post}
              onDelete={handleDeletePost}
              isGuidanceStaff={isGuidanceStaff}
            />
          ))
        ) : (
          !loading && <p className="no-posts-text">No posts yet.</p>
        )}
      </div>

      <CreatePostModal
        newPost={newPost}
        setNewPost={setNewPost}
        categories={categories}
        sections={sections}
        creating={creating}
        handleCreate={handleCreate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;