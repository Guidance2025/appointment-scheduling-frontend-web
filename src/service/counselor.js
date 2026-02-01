import { TruckElectric } from 'lucide-react';
import { API_BASE_URL, GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF, GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS, GET_NOTIFICATION_BY_USER, GET_PROFILE_BY_EMPLOYEENUMBER, GET_UNREAD_NOTIFICATION, MARK_AS_READ } from './../../constants/api';

export async function getAllAppointmentByGuidanceStaff(guidanceStaffId) {
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    
    if (!JWT_TOKEN) {
      throw new Error("JWT Token Not Found");
    }
    
    const response = await fetch(GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF(guidanceStaffId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN  
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json(); 
    console.log("Appointments fetched:", data);
    return data;
    
  } catch (error) { 
    console.error("Error Fetching Appointment By Guidance Staff:", error);
    throw error; 
  }
}

export async function getAllCounselorAppointmentByStatus(guidanceStaffId) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  try {
    const response = await fetch(GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS(guidanceStaffId), {
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
         "Authorization": "Bearer " + JWT_TOKEN
      }

    })

    if(!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json();
    return data;

  }catch {
    throw new Error( "Error Fetching by Status",response.status)

  }
  
}

export async function getNotificationByUser(userID){
  const JWT_TOKEN = localStorage.getItem("jwtToken")  
  if(!JWT_TOKEN) {
    console.error("JwtToken Not Found")
    return;
  }
  
  try { 
    const response = await fetch(GET_NOTIFICATION_BY_USER(userID), {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",  
        "Authorization": `Bearer ${JWT_TOKEN}` 
      }
    })
    
    if(!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json();

  } catch(error) { 
    console.error("Failed Showing Notification", error);
  }
}


export async function getUnreadNotification(userId) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");

  if (!JWT_TOKEN) {
    console.error("JWT Token not found");
    return; 
  }

  try {
    const response = await fetch(GET_UNREAD_NOTIFICATION(userId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JWT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    return null; 
  }
}

export async function markNotificationAsRead(userId) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  if(!JWT_TOKEN) {
    console.error("JwtToken Not Found")
    return;
  }
  
  try { 
    const response = await fetch(MARK_AS_READ(userId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JWT_TOKEN}`
      }
    })
    
    if(!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.text( );
    

  } catch(error) {
    console.error("Failed to mark notification as read", error);
    throw error;
  }
}



export async function getProfileByEmployeeNumber(employeeNumber){
  const JWT_TOKEN = localStorage.getItem("jwtToken");

  try {
    const response = await fetch(GET_PROFILE_BY_EMPLOYEENUMBER(employeeNumber),{
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
        "Authorization" : `Bearer ${JWT_TOKEN}`
      }
    }); 

    if(!response.ok){
      throw new Error(`Response Failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();

  } catch(error) {
    console.error("Error Fetching profile:", error.message);
    throw error;
  }
}


export async function updateCounselorProfile(guidanceStaffId, profileData) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    
    console.log("=== UPDATE COUNSELOR PROFILE DEBUG ===");
    console.log("Guidance Staff ID:", guidanceStaffId);
    console.log("JWT Token exists:", !!jwtToken);
    
    if (!jwtToken) {
      throw new Error("No JWT Token Found. Please log in again.");
    }

    const requestBody = {};
    if (profileData.email?.trim()) {
      requestBody.email = profileData.email.trim();
    }
    if (profileData.contactNumber?.trim()) {
      requestBody.contactNumber = profileData.contactNumber.trim();
    }

    console.log("Request Body:", requestBody);
    

    const response = await fetch(`${API_BASE_URL}/counselor-profile/${guidanceStaffId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Response Status:", response.status);
    console.log("Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error Response:", errorText);
      throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
    }

    const updatedStaff = await response.json();
    console.log("Update successful!");
    return updatedStaff;

  } catch (error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    throw error;
  }
}


const searchStudentNumber  = async (studentNumber) => {
  try {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    
    if (!JWT_TOKEN) {
      throw new Error("JWT Token Not Found");
    }
    const response = await fetch(`${API_BASE_URL}/student/search/${studentNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JWT_TOKEN  
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) { 
    console.error("Error Searching Student By Student Number:", error);
    throw error;
  }
}
