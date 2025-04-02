import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';

/**
 * Service to collect parking occupancy data
 * This builds our historical dataset for predictions
 */
export const collectParkingData = async () => {
  try {
    console.log('Collecting parking occupancy data...');
    
    // Get all parking spaces
    const parkingSpacesSnapshot = await getDocs(query(collection(db, 'ParkingSpaces')));
    
    // For each parking space, record current occupancy data
    const dataPoints = [];
    for (const spaceDoc of parkingSpacesSnapshot.docs) {
      const spaceData = spaceDoc.data();
      
      // Create a data point for this parking space
      const dataPoint = {
        parkingSpaceId: spaceDoc.id,
        parkingSpaceName: spaceData.Name,
        totalSlots: spaceData.TotalSlots || 0,
        availableSlots: spaceData.AvailableSlots || 0,
        occupancyRate: spaceData.TotalSlots ? 
          (spaceData.TotalSlots - spaceData.AvailableSlots) / spaceData.TotalSlots : 0,
        timestamp: serverTimestamp(),
        dayOfWeek: new Date().getDay(),
        hour: new Date().getHours(),
        dateString: new Date().toISOString().split('T')[0]
      };
      
      dataPoints.push(addDoc(collection(db, 'parkingHistoricalData'), dataPoint));
    }
    
    await Promise.all(dataPoints);
    console.log(`Successfully collected data for ${dataPoints.length} parking spaces`);
    
  } catch (error) {
    console.error('Error collecting parking data:', error);
  }
};