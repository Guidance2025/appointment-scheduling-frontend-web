import { GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF, GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF_STATUS } from './../../constants/api';

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