import React, { useEffect, useState } from "react";
import "../../css/Dashboard.css";
import CreatePostModal from "./modal/CreatePostModal";
import PostCard from "./PostCard";
import ConfirmDialog from "../../helper/ConfirmDialog";  
import "../../css/ConfirmDialog.css";
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
import { API_BASE_URL } from '../../../constants/api';
import { MOODS_URL } from "../../../constants/api";

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
  const [newPost, setNewPost] = useState({category_name: "",post_content: "",section_id: null,  section_code: "",});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isGuidanceStaff, setIsGuidanceStaff] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); 
  const [postToDelete, setPostToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Analytics data
  const [selfAssessmentCount, setSelfAssessmentCount] = useState(0);
  const [exitInterviewCount, setExitInterviewCount] = useState(0);
  const [moodTrendCount, setMoodTrendCount] = useState(0);
  const [moodDistribution, setMoodDistribution] = useState({ happy: 0, neutral: 0, sad: 0 });

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
    const normalized = (data || []).map(normalizeCategory);
    const uniqueCategories = [];
    const seenNames = new Set();
    for (const cat of normalized) {
      const name = cat.category_name;
      if (!seenNames.has(name)) {
        seenNames.add(name);
        uniqueCategories.push(cat);
      }
    }
    setCategories(uniqueCategories);
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

  // Load analytics data
  const loadAnalytics = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      // Fetch Self-Assessment responses
      const selfAssessmentRes = await fetch(`${API_BASE_URL}/self-assessment/student-response`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (selfAssessmentRes.ok) {
        const selfAssessmentData = await selfAssessmentRes.json();
        const answeredCount = selfAssessmentData.filter(item => item.responseText && item.responseText.trim() !== '').length;
        setSelfAssessmentCount(answeredCount);
      }

      // Fetch Exit Interview responses
      const exitInterviewRes = await fetch(`${API_BASE_URL}/exit-interview/student-response`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (exitInterviewRes.ok) {
        const exitInterviewData = await exitInterviewRes.json();
        const answeredCount = exitInterviewData.filter(item => item.responseText && item.responseText.trim() !== '').length;
        setExitInterviewCount(answeredCount);
      }

      // Fetch Mood Trend entries
      const moodRes = await fetch(MOODS_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (moodRes.ok) {
        const moodData = await moodRes.json();
        const moodEntries = Array.isArray(moodData) ? moodData : [];
        setMoodTrendCount(moodEntries.length);

        // Calculate mood distribution
        let happy = 0, neutral = 0, sad = 0;
        moodEntries.forEach(entry => {
          const emotions = entry.emotions || [];
          const hasPositive = emotions.some(e => ["happy", "excited", "hopeful", "calm"].includes(e));
          const hasNegative = emotions.some(e => ["angry", "frustrated", "worried", "sad"].includes(e));
          
          if (hasPositive && !hasNegative) happy++;
          else if (hasNegative && !hasPositive) sad++;
          else if (emotions.length > 0) neutral++;
          else neutral++;
        });

        const total = moodEntries.length || 1;
        setMoodDistribution({
          happy: Math.round((happy / total) * 100),
          neutral: Math.round((neutral / total) * 100),
          sad: Math.round((sad / total) * 100)
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const checkUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isStaff = user.role === "GUIDANCE_STAFF" || user.role === "guidance_staff" || user.role === "ADMIN" || user.role === "admin";
      setIsGuidanceStaff(isStaff);
    } catch (e) {
      console.error("Check user role failed:", e);
      setIsGuidanceStaff(true); 
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        checkUserRole();
        await Promise.all([loadPosts(), loadQuote(), loadCategories(), loadSections(), loadAnalytics()]);
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDeletePost = (postId) => {
    setPostToDelete(postId); 
    setIsConfirmOpen(true);  
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete);
      setPosts((prev) => prev.filter((p) => p.post_id !== postToDelete));
      setIsConfirmOpen(false);  
      setPostToDelete(null); 
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete post: " + e.message);
      setIsConfirmOpen(false);  
      setPostToDelete(null);
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
        sectionName: newPost.section_id,
        postContent,
      });

      await Promise.all([loadPosts(), loadQuote()]);

      setNewPost({
        category_name: "",
        post_content: "",
        section_id: null,  
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
          <h1>Welcome</h1>  
          <p className="header-subtitle">
            {isGuidanceStaff ? "Guidance Staff Posts Management" : "Student Updates Feed"}
          </p>
        </div>
        <button
          onClick={() => {
            console.log("[Dashboard] Opening CreatePostModal with sections:", sections);
            setNewPost({
              category_name: "",
              post_content: "",
              section_id: null, 
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

      {/* Analytics Cards Row - 3 Column Layout */}
      <div className="analytics-cards-row">
        <div className="analytics-stat-card analytics-primary">
          <div className="analytics-stat-icon">📝</div>
          <div className="analytics-stat-details">
            <p className="analytics-stat-label">Self-Assessment</p>
            <h3 className="analytics-stat-value">{selfAssessmentCount}</h3>
            <p className="analytics-stat-change">Total responses</p>
          </div>
        </div>

        <div className="analytics-stat-card analytics-success">
          <div className="analytics-stat-icon">🚪</div>
          <div className="analytics-stat-details">
            <p className="analytics-stat-label">Exit Interviews</p>
            <h3 className="analytics-stat-value">{exitInterviewCount}</h3>
            <p className="analytics-stat-change">Completed interviews</p>
          </div>
        </div>

        <div className="analytics-stat-card analytics-info">
          <div className="analytics-stat-icon">😊</div>
          <div className="analytics-stat-details">
            <p className="analytics-stat-label">Mood Entries</p>
            <h3 className="analytics-stat-value">{moodTrendCount}</h3>
            <p className="analytics-stat-change">Student submissions</p>
          </div>
        </div>
      </div>

      {/* Mood Distribution - Separate Full Width Card */}
      <div className="analytics-cards-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="analytics-stat-card analytics-mood">
          <div className="analytics-mood-container">
            <div className="analytics-mood-breakdown-mini">
              <div className="analytics-mini-bar">
                <div className="analytics-mini-segment analytics-happy" style={{ width: `${moodDistribution.happy}%` }}></div>
                <div className="analytics-mini-segment analytics-neutral" style={{ width: `${moodDistribution.neutral}%` }}></div>
                <div className="analytics-mini-segment analytics-sad" style={{ width: `${moodDistribution.sad}%` }}></div>
              </div>
            </div>
            <h3 className="analytics-mood-title">Mood Distribution</h3>
            <div className="analytics-mood-stats">
              <span className="analytics-mood-stat">
                <span className="analytics-dot analytics-happy-dot"></span>
                {moodDistribution.happy}% Happy
              </span>
              <span className="analytics-mood-stat">
                <span className="analytics-dot analytics-neutral-dot"></span>
                {moodDistribution.neutral}% Neutral
              </span>
              <span className="analytics-mood-stat">
                <span className="analytics-dot analytics-sad-dot"></span>
                {moodDistribution.sad}% Sad
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs-section">
        <div className="tabs-header-container">
          <div className="tabs-navigation">
            <button
              className={`tab-item ${activeTab === 0 ? 'active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
               Announcements
            </button>
            <button
              className={`tab-item ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
               Events
            </button>
          </div>
        </div>
        
        <div className="tab-content-container">
          {activeTab === 0 && (
            <div className="posts-container">
              {posts && posts.some(p => 
                (p.category_name?.toLowerCase() === "announcement" || 
                 p.CATEGORY_NAME?.toLowerCase() === "announcement")
              ) ? (
                posts
                  .filter(p => 
                    p.category_name?.toLowerCase() === "announcement" || 
                    p.CATEGORY_NAME?.toLowerCase() === "announcement"
                  )
                  .map((post) => (
                    <PostCard
                      key={post.post_id}
                      post={post}
                      onDelete={handleDeletePost}
                      isGuidanceStaff={isGuidanceStaff}
                    />
                  ))
              ) : (
                <p className="no-posts-text">
                  <span className="no-posts-icon">📢</span>
                  No announcements yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="posts-container">
              {posts && posts.some(p => 
                (p.category_name?.toLowerCase() === "events" || 
                 p.CATEGORY_NAME?.toLowerCase() === "events")
              ) ? (
                posts
                  .filter(p => 
                    p.category_name?.toLowerCase() === "events" || 
                    p.CATEGORY_NAME?.toLowerCase() === "events"
                  )
                  .map((post) => (
                    <PostCard
                      key={post.post_id}
                      post={post}
                      onDelete={handleDeletePost}
                      isGuidanceStaff={isGuidanceStaff}
                    />
                  ))
              ) : (
                <p className="no-posts-text">
                  <span className="no-posts-icon">📅</span>
                  No events yet.
                </p>
              )}
            </div>
          )}
        </div>
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

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default Dashboard;