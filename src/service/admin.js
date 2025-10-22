import { API_BASE_URL, GET_ALL_ACCOUNTS_URL, GET_ALL_STUDENT_URL, REGISTER_ACCOUNT } from "../../constants/api";


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