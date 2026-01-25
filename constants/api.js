export const API_BASE_URL = "http://localhost:8080";

export const REGISTER_FCM_TOKEN = `${API_BASE_URL}/notification/register-token`;
export const LOGIN_URL = `${API_BASE_URL}/user/login`;

//ADMIN
export const GET_ALL_ACCOUNTS_URL = `${API_BASE_URL}/admin/accounts`;
export const GET_ALL_STUDENT_URL = `${API_BASE_URL}/admin/student-information`;
export const REGISTER_ACCOUNT = `${API_BASE_URL}/admin/register`;
export const GET_ADMIN_PROFILE_BY_USERID = (userId) => `${API_BASE_URL}/admin/profile/${userId}`;
export const GET_GUIDANCESTAFF_ACCOUNTS = (`${API_BASE_URL}/admin/guidance-staff-accounts`);
export const GET_STUDENT_ACCOUNTS = (`${API_BASE_URL}/admin/student-accounts`);
export const DELETE_STUDENT_ACCCOUNT = (studentNumber) => (`${API_BASE_URL}/admin/delete-student/${studentNumber}`);
export const DELETE_GUIDANCESTAFF_ACCCOUNT = (employeeNumber) => (`${API_BASE_URL}/admin/delete-employee/${employeeNumber}`);
export const UPDATE_STUDENT_ACCCOUNT = (`${API_BASE_URL}/admin/students/update`);
export const UPDATE_GUIDANCE_STAFF_ACCOUNT = (`${API_BASE_URL}/admin/guidance-staff/update`);

//GUIDANCE
export const GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF = (guidanceStaffId) => (`${API_BASE_URL}/counselor/find/appointment/${guidanceStaffId}`);
export const GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS = (guidanceStaffId) => (`${API_BASE_URL}/counselor/appointment/${guidanceStaffId}`);
export const GET_NOTIFICATION_BY_USER = (userId) => (`${API_BASE_URL}/notification/${userId}`);
export const GET_PROFILE_BY_EMPLOYEENUMBER = (employeeNumber) => (`${API_BASE_URL}/counselor-profile/${employeeNumber}`);

//POST
export const POSTS_URL = `${API_BASE_URL}/api/posts`;
export const QUOTE_OF_THE_DAY_URL = `${API_BASE_URL}/api/posts/quote-of-the-day`;
export const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
export const LATEST_POSTS_URL = `${API_BASE_URL}/api/posts/latest`;
export const SECTIONS_URL = `${API_BASE_URL}/api/sections`;
export const DELETE_POST_URL = (id) => `${API_BASE_URL}/api/${id}`;
export const POST_BY_ID_URL = (id) => `${API_BASE_URL}/api/posts/${id}`;
export const UPDATE_POST_URL = (id) => `${API_BASE_URL}/api/posts/${id}`;
export const SECTIONS_COURSES_URL = `${SECTIONS_URL}/courses`;
export const SECTIONS_CLUSTERS_URL = `${SECTIONS_URL}/clusters`;
export const FETCH_ALL_SECTIONS_BY_STUDENT = `${API_BASE_URL}/api/posts/students/section`;

//MOODS
export const MOODS_URL = `${API_BASE_URL}/moods/retrieve-all`;

//NOTIFICATION
export const GET_UNREAD_NOTIFICATION = (userId) => (`${API_BASE_URL}/notification/unreadCount/${userId}`);
export const MARK_AS_READ = (userId) => (`${API_BASE_URL}/notification/markAsRead/${userId}`);
export const CLEAR_ALL_NOTIFICATION = (userId) => (`${API_BASE_URL}/notification/${userId}/clear-all`) 

// FORGET PASSWORD
export const FORGET_PASSWORD = `${API_BASE_URL}/user/reset-password`;

