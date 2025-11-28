export const API_BASE_URL = "http://localhost:8080";

// //POSTS//
export const POSTS_URL = `${API_BASE_URL}/api/posts`;
export const QUOTE_OF_THE_DAY_URL = `${API_BASE_URL}/api/posts/quote-of-the-day`;
export const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
export const SECTIONS_URL = `${API_BASE_URL}/api/sections`;
//export const DELETE_POST_URL = (postId) => `${API_BASE_URL}/api/posts/${postId}`;

export const DELETE_POST_URL = (id) => `${POSTS_URL}/${id}`;