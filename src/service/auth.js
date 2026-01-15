import { LOGIN_URL } from "../../constants/api";

export async function login(username, password) {
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      
      try {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        }
        
        errorMessage = errorMessage.toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorMessage = `Login failed (${response.status})`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const guidanceStaffId = data.guidanceStaffId; 
    const jwtToken = response.headers.get("Jwt-Token");

    if (!jwtToken) {
      throw new Error("Authentication token not received");
    }

    return { data, jwtToken, guidanceStaffId };
    
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}