import { LOGIN_URL } from "../../constants/api";

export async function login(username, password) {
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(errMsg || `Login failed (${response.status})`);
    }

    const data = await response.json();
    const guidanceStaffId = data.guidanceStaffId; 
    const jwtToken = response.headers.get("Jwt-Token");

    return { data, jwtToken, guidanceStaffId };
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}
