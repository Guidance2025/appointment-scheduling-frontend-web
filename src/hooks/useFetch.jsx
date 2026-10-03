import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'

  const useFetch = (url) => {
  const [data,setData] = useState(null);    
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
    
 useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch(url);
            
            const result = await response.json();

            setData(result);
            setLoading(false);
            
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error);
            setLoading(false);
        }
    };

    fetchData();
 }, [url]);
   
  
  return {
    data,
    loading,
    error
  }
}

export default useFetch
