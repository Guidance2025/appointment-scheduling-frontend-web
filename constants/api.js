export const API_BASE_URL = "http://localhost:8080";

export const REGISTER_FCM_TOKEN = `${API_BASE_URL}/notification/register-token`;
export const LOGIN_URL = `${API_BASE_URL}/user/login`;

export const GET_ALL_ACCOUNTS_URL = `${API_BASE_URL}/admin/accounts`;
export const GET_ALL_STUDENT_URL = `${API_BASE_URL}/admin/student-information`;
export const REGISTER_ACCOUNT = `${API_BASE_URL}/admin/register`;

export const GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF = (guidanceStaffId) => (`${API_BASE_URL}/counselor/find/appointment/${guidanceStaffId}`);
export const GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS = (guidanceStaffId,status) => (`${API_BASE_URL}/counselor/appointment/${status}/${guidanceStaffId}`);
