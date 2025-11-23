import { API_BASE_URL, DELETE_GUIDANCESTAFF_ACCCOUNT, DELETE_STUDENT_ACCCOUNT, GET_ADMIN_PROFILE_BY_USERID, GET_ALL_ACCOUNTS_URL, GET_ALL_STUDENT_URL, GET_GUIDANCESTAFF_ACCOUNTS, GET_STUDENT_ACCOUNTS, REGISTER_ACCOUNT, UPDATE_GUIDANCE_STAFF_ACCOUNT, UPDATE_STUDENT_ACCCOUNT } from "../../constants/api";


const JWT_TOKEN = localStorage.getItem("jwtToken");

export async function getAllAccounts() {
  try {
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


export async function register(dataToSubmit){
  try {
    if(!JWT_TOKEN){return error;}

    const response = await fetch(`${REGISTER_ACCOUNT}`,{
      method : "POST",
      headers : {
        "Content-Type": "application/json",
         "Authorization": "Bearer " + JWT_TOKEN,
      },
      body:JSON.stringify(dataToSubmit)
    })

    if(response.ok) {
      return await response.json();
    }
    console.log("Registration Failed", error)

  } catch{
    console.log(error);
  }
}

export async function getAdminProfile (userId) {

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


