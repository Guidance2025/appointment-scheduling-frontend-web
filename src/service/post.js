import {
  POSTS_URL,
  QUOTE_OF_THE_DAY_URL,
  DELETE_POST_URL,
  CATEGORIES_URL,
  LATEST_POSTS_URL,
  FETCH_ALL_SECTIONS_BY_STUDENT,
  API_BASE_URL,
} from "../../constants/api";

// Get auth headers with JWT token
const authHeaders = () => {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  return JWT_TOKEN ? { Authorization: `Bearer ${JWT_TOKEN}` } : {};
};

// Fetch helper: throws detailed error with status + text
const toJson = async (res) => {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status} ${res.statusText}`;
    try {
      const text = await res.text();
      console.log("Raw response text:", text);
      if (text) {
        try {
          const json = JSON.parse(text);
          console.log("Parsed error JSON:", json);
          errorMessage = json.error || json.message || json.errorMessage || text;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    } catch (err) {
      console.error("Error parsing response:", err);
    }
    console.error("Throwing error:", errorMessage);
    throw new Error(errorMessage);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Fetch all posts with pagination
 */
export const fetchPosts = async (limit = 20) => {
  const res = await fetch(`${POSTS_URL}?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res);
};

/**
 * Fetch latest posts
 */
export const fetchLatestPosts = async (limit = 20) => {
  const res = await fetch(`${LATEST_POSTS_URL}?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res);
};

/**
 * Fetch quote of the day
 */
export const fetchQuoteOfTheDay = async () => {
  const res = await fetch(QUOTE_OF_THE_DAY_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res);
};

/**
 * Create a new post
 * @param {Object} postData - Post data object
 * @param {string} postData.categoryName - Category of the post
 * @param {string} postData.postContent - Content of the post
 * @param {Array<string>} postData.sectionNames - Array of section names to target (empty = all sections)
 */
export const createPost = async (postData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    
    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log("Creating post with data:", postData);

    // Build the request body
    const requestBody = {
      categoryName: postData.categoryName,
      postContent: postData.postContent,
    };

    // Add sectionNames if provided (empty array means "all sections")
    if (postData.sectionNames !== undefined) {
      requestBody.sectionNames = postData.sectionNames;
    }

    console.log("Request body:", requestBody);

    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

/**
 * Delete a post
 */
export const deletePost = async (postId) => {
  const res = await fetch(DELETE_POST_URL(postId), {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return true;
};

/**
 * Fetch all available categories
 */
export const fetchCategories = async () => {
  const res = await fetch(CATEGORIES_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res);
};

/**
 * Submit an anonymous comment on a question post
 * @param {number} postId - ID of the post (question)
 * @param {string} commentText - Text of the anonymous comment
 */
export const submitAnonymousComment = async (postId, commentText) => {
  const res = await fetch(`${POSTS_URL}/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      responseText: commentText?.trim(),
    }),
  });
  return toJson(res);
};

/**
 * Fetch all comments for a specific post
 * @param {number} postId - ID of the post
 */
export const fetchPostComments = async (postId) => {
  const res = await fetch(`${POSTS_URL}/${postId}/comments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return toJson(res);
};

/**
 * Fetch all sections available (returns section names as strings)
 */
export const fetchAllSectionsByStudent = async () => {
  try {
    const response = await fetch(FETCH_ALL_SECTIONS_BY_STUDENT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sections: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error in fetchAllSectionsByStudent:', error);
    throw error;
  }
};

/**
 * Fetch posts targeted to a specific section
 * @param {string} sectionName - Name of the section (e.g., "BSCS-1A")
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise} Array of posts with student count
 */
export const fetchPostsBySection = async (sectionName, limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/section/${encodeURIComponent(sectionName)}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch posts by section: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Posts for section ${sectionName}:`, data);
    
    return data;
  } catch (error) {
    console.error('Error in fetchPostsBySection:', error);
    throw error;
  }
};

export const normalizePost = (p) => ({
  post_id: p.POST_ID ?? p.post_id ?? p.postId,
  post_content: p.POST_CONTENT ?? p.post_content ?? p.postContent,
  posted_date: p.POSTED_DATE ?? p.posted_date ?? p.postedDate,
  category_name: p.CATEGORY_NAME ?? p.category_name ?? p.categoryName,
  section_name: p.SECTION_NAME ?? p.section_name ?? p.sectionName,
  organization: p.ORGANIZATION ?? p.organization,
  posted_by: p.POSTED_BY ?? p.posted_by ?? p.postedBy,
  student_count: p.STUDENT_COUNT ?? p.student_count ?? p.studentCount,
  target_section: p.TARGET_SECTION ?? p.target_section ?? p.targetSection
});

export const normalizeCategory = (c) => ({
  category_id: c.CATEGORY_ID ?? c.category_id ?? c.categoryId,
  category_name: c.CATEGORY_NAME ?? c.category_name ?? c.categoryName
});