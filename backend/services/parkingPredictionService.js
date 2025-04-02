import { db } from '../firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Predicts parking availability based on historical data patterns
 */
export const predictParkingAvailability = async (parkingSpaceId, targetDate) => {
  try {
    if (!parkingSpaceId || !targetDate) {
      return {
        predictedAvailableSlots: null,
        confidence: 'low',
        message: 'Missing required parameters'
      };
    }
    
    // Get the day of week and hour for the target date
    const targetDay = targetDate.getDay();
    const targetHour = targetDate.getHours();
    const isWeekend = targetDay === 0 || targetDay === 6;
    
    // Query for historical data matching similar conditions
    const historicalDataRef = collection(db, 'parkingHistoricalData');
    
    // First try with the optimal query (requires composite index)
    let querySnapshot;
    try {
      const historicalQuery = query(
        historicalDataRef,
        where('parkingSpaceId', '==', parkingSpaceId),
        where('dayOfWeek', '==', targetDay),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      querySnapshot = await getDocs(historicalQuery);
    } catch (indexError) {
      console.log("Index not available yet, using fallback query approach:", indexError.message);
      
      // Fallback to simpler query without multiple conditions + ordering
      const simpleQuery = query(
        historicalDataRef,
        where('parkingSpaceId', '==', parkingSpaceId)
      );
      
      const allDataSnapshot = await getDocs(simpleQuery);
      
      // Filter in memory instead
      const allData = [];
      allDataSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.dayOfWeek === targetDay) {
          allData.push({id: doc.id, ...data});
        }
      });
      
      // Sort manually by timestamp (descending)
      allData.sort((a, b) => {
        const timestampA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timestampB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timestampB - timestampA;
      });
      
      // Take only the first 100 items
      const limitedData = allData.slice(0, 100);
      
      // Convert to a format similar to querySnapshot
      querySnapshot = {
        empty: limitedData.length === 0,
        size: limitedData.length,
        docs: limitedData.map(item => ({
          id: item.id,
          data: () => item
        })),
        forEach: callback => limitedData.forEach(item => callback({
          id: item.id,
          data: () => item
        }))
      };
    }
    
    // If we don't have enough data, return a default prediction
    if (querySnapshot.empty || querySnapshot.size < 5) {
      return {
        predictedAvailableSlots: null,
        confidence: 'low',
        message: 'Not enough historical data to make a prediction'
      };
    }
    
    // Get the parking space details to know total slots
    const parkingSpaceData = await getParkingSpaceData(parkingSpaceId);
    const totalSlots = parkingSpaceData?.TotalSlots || 0;
    
    // Extract data points for our time-based model
    const dataPoints = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.hour === targetHour || 
          data.hour === targetHour - 1 || 
          data.hour === targetHour + 1) {
        dataPoints.push({
          hour: data.hour,
          occupancyRate: data.occupancyRate,
          availableSlots: data.availableSlots,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
        });
      }
    });
    
    // Sort by recency for trending calculation
    dataPoints.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate trends over recent days
    const trendingUp = isTrendingUp(dataPoints);
    
    // Calculate average occupancy for the target hour
    const targetHourPoints = dataPoints.filter(p => p.hour === targetHour);
    let avgOccupancyRate;
    
    if (targetHourPoints.length >= 3) {
      // We have enough data for this exact hour
      avgOccupancyRate = calculateWeightedAverage(targetHourPoints);
    } else {
      // Use all nearby hours with a penalty
      avgOccupancyRate = calculateWeightedAverage(dataPoints);
    }
    
    // Adjust for weekends vs weekdays if we have data to support this
    if (isWeekend) {
      // Weekend adjustment - typically less occupied on weekends
      // This is a simplified approach - you'd ideally use real data to determine this
      avgOccupancyRate *= 0.9;
    }
    
    // Apply trending - if occupancy is trending up, increase prediction
    if (trendingUp) {
      avgOccupancyRate = Math.min(1, avgOccupancyRate * 1.1); // 10% increase but not over 100%
    }
    
    // Calculate predicted slots
    const predictedAvailableSlots = Math.max(0, Math.round(totalSlots * (1 - avgOccupancyRate)));
    
    // Determine confidence level based on sample size
    let confidence = 'low';
    if (dataPoints.length >= 20) confidence = 'high';
    else if (dataPoints.length >= 10) confidence = 'medium';
    
    return {
      predictedAvailableSlots,
      predictedOccupancyRate: avgOccupancyRate,
      confidence,
      totalSlots,
      dataPoints: dataPoints.length,
      trendingUp,
      isWeekend
    };
  } catch (error) {
    console.error('Error predicting parking availability:', error);
    return {
      predictedAvailableSlots: null,
      confidence: 'low',
      message: `Prediction error: ${error.message}`
    };
  }
};

// Helper function to get parking space details
async function getParkingSpaceData(parkingSpaceId) {
  try {
    const parkingSpacesRef = collection(db, 'ParkingSpaces');
    const parkingSpaceQuery = query(
      parkingSpacesRef,
      where('__name__', '==', parkingSpaceId)
    );
    
    const querySnapshot = await getDocs(parkingSpaceQuery);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching parking space data:", error);
    return null;
  }
}

// Helper function to calculate weighted average (more recent data has more weight)
function calculateWeightedAverage(dataPoints) {
  if (dataPoints.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  dataPoints.forEach((point, index) => {
    // Weight decreases as index increases (older data)
    const weight = dataPoints.length - index;
    totalWeight += weight;
    weightedSum += point.occupancyRate * weight;
  });
  
  return weightedSum / totalWeight;
}

// Helper function to detect if occupancy is trending up
function isTrendingUp(dataPoints) {
  if (dataPoints.length < 3) return false;
  
  // Get the 3 most recent points
  const recent = dataPoints.slice(0, 3);
  
  // Simple trend detection
  return recent[0].occupancyRate > recent[2].occupancyRate;
}