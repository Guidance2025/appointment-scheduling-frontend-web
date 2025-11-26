// src/service/post.js
import {
  POSTS_URL,
  QUOTE_OF_THE_DAY_URL,
  DELETE_POST_URL
} from "../api"; // if your api index is at src/api/index.js

// Optional: add Authorization if your backend is secured with JWT
const authHeaders = () => {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  return JWT_TOKEN ? { Authorization: `Bearer ${JWT_TOKEN}` } : {};
};

// Fetch helper: throws detailed error with status + text
const toJson = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
};

// List posts (excludes Quote category if your backend query does that)
export const fetchPosts = async (limit = 20) => {
  const res = await fetch(`${POSTS_URL}?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    }
  });
  return toJson(res);
};

// Quote of the day
export const fetchQuoteOfTheDay = async () => {
  const res = await fetch(QUOTE_OF_THE_DAY_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    }
  });
  return toJson(res);
};

// Create post (ALWAYS send categoryName so backend inserts category row)
export const createPost = async ({ categoryName, sectionId, postContent }) => {
  const res = await fetch(POSTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({
      categoryName: categoryName?.trim(), // text only; backend inserts category
      sectionId: sectionId ?? null,
      postContent: postContent?.trim()
    })
  });
  return toJson(res);
};

// Delete post
export const deletePost = async (postId) => {
  const res = await fetch(DELETE_POST_URL(postId), {
    method: "DELETE",
    headers: {
      ...authHeaders()
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return true;
};
