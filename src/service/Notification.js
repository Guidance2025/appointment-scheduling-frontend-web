import { CLEAR_ALL_NOTIFICATION } from "../../constants/api";


export async function clearAllNotification(userId) {
 const JWT_TOKEN = localStorage.getItem("jwtToken");
    if(!JWT_TOKEN){
     console.log("No Token JWt")
    }

    try {
        const response = await fetch(CLEAR_ALL_NOTIFICATION(userId), {
            method: "PATCH",
            headers: {
                "Content-Type" : "application/json",
                "Authorization": "Bearer " + JWT_TOKEN
            },
            body:JSON.stringify({userId})
        });

        if (!response.ok) {
            throw new Error(`Failed to clear notifications: ${response.status}`);
        }

       return await response.text();
       
    } catch(error) {
        console.error("Error Clearing Notification", error);
        throw error;
    }


}
        
