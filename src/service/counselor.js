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

export async function getAllCounselorAppointmentByStatus(guidanceStaffId,status) {
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  try {
    const response = await fetch(GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS(guidanceStaffId,status), {
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

export async function markNotificationAsRead(notificationId) {
  const JWT_TOKEN = localStorage.getItem("jwtToken")  
  if(!JWT_TOKEN) {
    console.error("JwtToken Not Found")
    return;
  }
  
  try { 
    const response = await fetch(MARK_AS_READ(notificationId), {
      method: "PATCH",
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