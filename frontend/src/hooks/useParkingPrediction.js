import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for getting parking availability predictions
 */
export const useParkingPrediction = (parkingSpaceId, targetDate) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Add debounce mechanism
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (!parkingSpaceId) return;
    
    // Clear any pending requests
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setLoading(true);
    
    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        // Format date and time
        const dateString = targetDate ? 
          targetDate.toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];
          
        const timeString = targetDate ? 
          targetDate.toTimeString().split(' ')[0].substring(0, 5) : 
          new Date().toTimeString().split(' ')[0].substring(0, 5);
        
        console.log(`Requesting prediction: ${parkingSpaceId}, ${dateString}, ${timeString}`);
        
        // Your existing fetch code
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(
          `${baseUrl}/api/predictions/${parkingSpaceId}?date=${dateString}&time=${timeString}`,
          { 
            headers: { 'Accept': 'application/json' }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPrediction(data);
      } catch (err) {
        console.error('Error fetching prediction:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // Wait 300ms before making the API call
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [parkingSpaceId, targetDate]);
  
  return { prediction, loading, error };
};