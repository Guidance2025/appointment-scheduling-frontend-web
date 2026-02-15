import { API_BASE_URL, DELETE_GUIDANCESTAFF_ACCCOUNT, DELETE_STUDENT_ACCCOUNT, GET_ADMIN_PROFILE_BY_USERID, GET_ALL_ACCOUNTS_URL, GET_ALL_ORGANIZATIONS, GET_ALL_STUDENT_URL, GET_GUIDANCESTAFF_ACCOUNTS, GET_STUDENT_ACCOUNTS, REGISTER_ACCOUNT, UPDATE_GUIDANCE_STAFF_ACCOUNT, UPDATE_STUDENT_ACCCOUNT } from "../../constants/api";



export async function getAllAccounts() {
  try {
      const JWT_TOKEN = localStorage.getItem("jwtToken");

    if(!JWT_TOKEN){return error;}
    const response = await fetch(GET_ALL_ACCOUNTS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Get All Accounts Error:", error);
    throw error;
  }
}

export async function getAllStudents(){
    try {
      const JWT_TOKEN = localStorage.getItem("jwtToken");
      if(!JWT_TOKEN){return error;}

      const response = await fetch(`${GET_ALL_STUDENT_URL}`, {
        method : "GET",
        headers: {
        "Content-Type" : "application/json",
        "Authorization" : "Bearer " + JWT_TOKEN,
        },
      })

      if(response.ok){
        return await response.json();
      }

    }catch(error){
        console.log("Get All Student Error ", error)
    }
}



export async function getAllOrganizations(){
    try {
      const JWT_TOKEN = localStorage.getItem("jwtToken");
      if(!JWT_TOKEN){return error;}

      const response = await fetch(`${GET_ALL_ORGANIZATIONS}`, {
        method : "GET",
        headers: {
        "Content-Type" : "application/json",
        "Authorization" : "Bearer " + JWT_TOKEN,
        },
      })
      if(response.ok){
        return await response.json();
      }

    }catch(error){
        console.log("Failed to fetch all organizations Error ", error)
    }
}



/**
 * Register a new student or guidance staff account
 * @param {Object} dataToSubmit - Registration data
 * @returns {Promise<Object>} Registration response
 * @throws {Error} If registration fails with error details
 */
export async function register(dataToSubmit) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  
  if (!JWT_TOKEN) {
    throw new Error("Authentication token not found");
  }

  try {
    const response = await fetch(REGISTER_ACCOUNT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
      body: JSON.stringify(dataToSubmit)
    });

    // Parse response body first (needed for both success and error)
    const data = await response.json();

    // Check if response is successful
    if (response.ok) {
      return data;
    }

    // If not OK, we have an error response from backend
    // The error data structure from your backend is:
    // { httpStatus, httpStatusCode, reason, message }
    const error = new Error(data.message || "Registration failed");
    error.response = {
      status: response.status,
      data: data
    };
    throw error;

  } catch (error) {
    // If error already has response (from above), re-throw it
    if (error.response) {
      throw error;
    }
    
    // Otherwise, it's a network error or JSON parse error
    console.error("Registration network error:", error);
    const networkError = new Error("Network error during registration");
    networkError.response = {
      status: 0,
      data: { message: error.message }
    };
    throw networkError;
  }
}

export async function getAdminProfile (userId) {
      const JWT_TOKEN = localStorage.getItem("jwtToken");

  if(!JWT_TOKEN) {
    console.error("Jwt Token Not Found");
  }

  try {
    const response = await fetch (GET_ADMIN_PROFILE_BY_USERID(userId), {
      method : "GET",
      headers : {
        "Content-Type" : "application/json",
        "Authorization" : `Bearer ${JWT_TOKEN}`
      }
    })
    return await response.json();

  }catch {
    console.error("Error Fetching Admin Profile");
  }
}


export async function getGuidanceStaffAccounts() {
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    if(!JWT_TOKEN){return error;}
    const response = await fetch(GET_GUIDANCESTAFF_ACCOUNTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,       
      },  
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch guidance staff accounts: ${response.status}`);
    }
    return await response.json();

  } catch (error) {
    console.error("Get Guidance Staff Accounts Error:", error);
    throw error;
  }
}

export async function getStudentAccounts() {
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    if(!JWT_TOKEN){return error;}
    const response = await fetch(GET_STUDENT_ACCOUNTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,   
      },
    }); 
    if (!response.ok) {
      throw new Error(`Failed to fetch student accounts: ${response.status}`);
    } 
    return await response.json();
  } catch (error) {
    console.error("Get Student Accounts Error:", error);
    throw error;
  }
}

export async function deleteStudentAccount(studentNumber){
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    if(!JWT_TOKEN){return error;}
    const response = await fetch(DELETE_STUDENT_ACCCOUNT(studentNumber), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete student account: ${response.status}`);
    }
    return await response.text();
  }
  catch (error) {
    console.error("Delete Student Account Error:", error);
    throw error;
  }
}

export async function deleteGuidanceStaffAccount(employeeNumber){
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    if(!JWT_TOKEN){return error;}
    const response = await fetch(DELETE_GUIDANCESTAFF_ACCCOUNT(employeeNumber), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });   
    if (!response.ok) {
      throw new Error(`Failed to delete guidance staff account: ${response.status}`);
    }
    return await response.text();
  }
  catch (error) {
    console.error("Delete Guidance Staff Account Error:", error);
    throw error;
  }

}
export async function UpdateStudentCredentials(studentNumber, newPassword, isLocked) {
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
     if(!JWT_TOKEN){return error;}
    const response = await fetch(UPDATE_STUDENT_ACCCOUNT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
      body: JSON.stringify({
        studentNumber,
        newPassword,
        isLocked
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update student account: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Update Student Account Error:", error);
    throw error;
  }

}
  export async function UpdateGuidanceStaffCredentials(employeeNumber,email,isLocked){
    try {

       const JWT_TOKEN = localStorage.getItem("jwtToken");
       if(!JWT_TOKEN){return error;}
      const response = await fetch(UPDATE_GUIDANCE_STAFF_ACCOUNT, {
        method : "PUT",
        headers : {
          "Content-Type": "application/json",
          "Authorization": "Bearer "+ JWT_TOKEN,
        },
         body: JSON.stringify ({
          id : employeeNumber,
          email,
          isLocked
          })
      }) 
       if (!response.ok) {
      throw new Error(`Failed to update guidance staff account: ${response.status}`);
    }
    return await response.text();

    }catch(error) {
      console.error("Update Student Account Error:", error);
       throw error;
    }
}

// Add these functions to your admin.js service file

/**
 * Check if email already exists in the system
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 */
export async function checkEmailExists(email) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  
  if (!JWT_TOKEN || !email || email.trim() === "") {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/check-email?email=${encodeURIComponent(email.trim())}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists || false;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

/**
 * Check if student number already exists in the system
 * @param {string} studentNumber - Student number to check
 * @returns {Promise<boolean>} True if student number exists, false otherwise
 */
export async function checkStudentNumberExists(studentNumber) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  
  if (!JWT_TOKEN || !studentNumber || studentNumber.trim() === "") {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/check-student-number?studentNumber=${encodeURIComponent(studentNumber.trim())}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists || false;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking student number:", error);
    return false;
  }
}

/**
 * Check if username already exists in the system
 * @param {string} username - Username to check
 * @returns  True if username exists, false otherwise
 */
export async function checkUsernameExists(username) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  
  if (!JWT_TOKEN || !username || username.trim() === "") {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/check-username?username=${encodeURIComponent(username.trim().toLowerCase())}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists || false;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
}
