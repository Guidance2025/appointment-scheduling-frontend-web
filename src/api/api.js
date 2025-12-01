export const API_BASE_URL = "http://localhost:8080";

//POSTS//
export const POSTS_URL = `${API_BASE_URL}/api/posts`;
export const QUOTE_OF_THE_DAY_URL = `${API_BASE_URL}/api/posts/quote-of-the-day`;
export const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
export const SECTIONS_URL = `${API_BASE_URL}/api/sections`;
//export const DELETE_POST_URL = (postId) => `${API_BASE_URL}/api/posts/${postId}`;

export const DELETE_POST_URL = (id) => `${POSTS_URL}/${id}`;

// Sections (filters) //
export const SECTIONS_COURSES_URL = `${SECTIONS_URL}/courses`;
export const SECTIONS_CLUSTERS_URL = `${SECTIONS_URL}/clusters`;

// Exit Interview (students + detail) //
export const EXIT_INTERVIEW_URL = `${API_BASE_URL}/api/exit-interview`;

// Students list with query params //
export const EXIT_STUDENTS_URL = (course = "All", cluster = "All") =>
  `${EXIT_INTERVIEW_URL}/students?course=${encodeURIComponent(course)}&cluster=${encodeURIComponent(cluster)}`;

// Single student detail (for modal) //
export const EXIT_STUDENT_DETAIL_URL = (studentId) =>
  `${EXIT_INTERVIEW_URL}/student/${encodeURIComponent(studentId)}`;

// Exit Interview //
export const QUESTIONS_URL = `${EXIT_INTERVIEW_URL}/questions`;
export const QUESTION_BY_ID_URL = (id) => `${QUESTIONS_URL}/${encodeURIComponent(id)}`;