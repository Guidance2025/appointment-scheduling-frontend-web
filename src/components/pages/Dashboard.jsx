import React, { useEffect, useState } from "react";
import "../../css/Dashboard.css";
import CreatePostModal from "./modal/CreatePostModal";
import { normalizePost, normalizeCategory } from "../../utils/normalize";
import { POSTS_URL, POST_BY_ID_URL, QUOTE_OF_THE_DAY_URL, LATEST_POSTS_URL,
  DELETE_POST_URL,
  UPDATE_POST_URL,
  CATEGORIES_URL,
} from "../../../constants/api";

const toJson = async (res) => {
  if (!res.ok) {const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
};

const fetchAllPosts = async () => {
  const res = await fetch(POSTS_URL);
  return toJson(res);
};

const fetchPostById = async (id) => {
  const res = await fetch(POST_BY_ID_URL(id));
  return toJson(res);
};

const createPostService = async (payload) => {
  const res = await fetch(POSTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return toJson(res);
};

const fetchQuoteOfTheDay = async () => {
  const res = await fetch(QUOTE_OF_THE_DAY_URL);
  return toJson(res);
};

const fetchLatestPosts = async () => {
  const res = await fetch(LATEST_POSTS_URL);
  return toJson(res);
};

const updatePostService = async (id, payload) => {
  const res = await fetch(UPDATE_POST_URL(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return toJson(res);
};

const deletePostService = async (id) => {
  const res = await fetch(DELETE_POST_URL(id), { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed ${res.status}`);
  return true;
};

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newPost, setNewPost] = useState({
    category_name: "",
    post_content: "",
    section_id: "",
    section_code: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const uniqueById = (arr) => {
    const seen = new Set();
    return (arr || []).filter((item) => {
      const id = item?.post_id ?? item?.postId;
      if (id == null || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const loadPosts = async () => {
    const data = await fetchLatestPosts();
    const normalized = (data || []).map(normalizePost);
    setPosts(uniqueById(normalized));
  };

  const loadQuote = async () => {
    const q = await fetchQuoteOfTheDay();
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

  const loadCategories = async () => {
    const res = await fetch(CATEGORIES_URL);
    if (!res.ok) return setCategories([]);
    const data = await res.json();
    setCategories((data || []).map(normalizeCategory));
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadPosts(), loadQuote(), loadCategories()]);
        setSelectedIds(new Set());
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleSelect = (post_id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(post_id) ? next.delete(post_id) : next.add(post_id);
      return next;
    });
  };

  const togglePin = (post) => {
    setPinnedPosts((prev) =>
      prev.find((p) => p.post_id === post.post_id)
        ? prev.filter((p) => p.post_id !== post.post_id)
        : [...prev, post]
    );
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected post(s)? This cannot be undone.`)) return;

    setBulkDeleting(true);
    const failed = [];

    try {
      for (const id of ids) {
        try {
          await deletePostService(id);
          setPosts((prev) => prev.filter((p) => p.post_id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } catch {
          failed.push(id);
        }
      }
      if (failed.length > 0) {
        alert(`Some posts could not be deleted (${failed.length}).`);
      }
    } finally {
      setBulkDeleting(false);
      try {
        await loadPosts();
      } catch (e) {
        console.error("Reload after delete failed:", e);
      }
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
      await createPostService({
        sectionId: newPost.section_id ? Number(newPost.section_id) : null,
        postContent,
        categoryName: newPost.category_name.trim(),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Create failed:", res.status, res.statusText, msg);
        alert(`Failed to create post: ${res.status} ${res.statusText}\n${msg}`);
        return;
      }

      
      await Promise.all([loadPosts(headers), loadQuote(headers)]);

      setNewPost({
        category_name: "",
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

  return (
    <div className="page-container">
      {/* Header */}
      {/* ... your JSX from earlier ... */}
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