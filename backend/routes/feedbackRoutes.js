import express from 'express';
import { analyzeText, detectLanguage } from '../services/sentimentAnalysis.js';
import { db } from '../database/firebase.js';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';

const router = express.Router();

/**
 * Endpoint to analyze feedback and save to Firestore
 * POST /api/analyze-feedback
 */
router.post('/analyze-feedback', async (req, res) => {
  try {
    const { feedback, userId, parkingSpaceId, rating, language } = req.body;
    
    if (!feedback || !userId || !parkingSpaceId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Detect language if not provided
    const detectedLanguage = language || await detectLanguage(feedback);
    
    // Analyze sentiment using Hugging Face API
    const sentiment = await analyzeText(feedback, detectedLanguage);
    
    // Save feedback with sentiment analysis to Firestore
    const docRef = await addDoc(collection(db, 'feedbacks'), {
      feedback,
      userId,
      parkingSpaceId,
      rating: Number(rating),
      sentiment,
      language: detectedLanguage,  // Store detected language
      timestamp: serverTimestamp(),
    });

    const feedbackId = docRef.id;

    // Calculate new average rating for this parking space
    const newAverageRating = await calculateAverageRating(parkingSpaceId);
    
    // Get feedback counts by sentiment
    const sentimentCounts = await calculateSentimentCounts(parkingSpaceId);
    
    // Also calculate language counts
    const languageCounts = await calculateLanguageCounts(parkingSpaceId);
    
    // Try both collection names to handle inconsistency
    const parkingSpaceRef = doc(db, 'parkingSpaces', parkingSpaceId);
    const parkingSpaceUpperRef = doc(db, 'ParkingSpaces', parkingSpaceId);
    
    // Check if the parking space exists in either collection
    const parkingSpaceDoc = await getDoc(parkingSpaceRef);
    const parkingSpaceUpperDoc = await getDoc(parkingSpaceUpperRef);
    
    // Update data to include language counts and add feedback ID to the parking space
    const updateData = {
      averageRating: newAverageRating,
      totalFeedbacks: sentimentCounts.total,
      positiveFeedbacks: sentimentCounts.positive,
      neutralFeedbacks: sentimentCounts.neutral,
      negativeFeedbacks: sentimentCounts.negative,
      languageCounts: languageCounts,
      feedbackIds: arrayUnion(feedbackId), // Add this feedback ID to the array
      lastUpdated: serverTimestamp()
    };
    
    // Update or create the document in the appropriate collection
    if (parkingSpaceDoc.exists()) {
      // Update in lowercase collection if it exists
      await updateDoc(parkingSpaceRef, updateData);
      console.log(`Updated parking space ${parkingSpaceId} with new rating: ${newAverageRating} and feedback ID: ${feedbackId}`);
    } else if (parkingSpaceUpperDoc.exists()) {
      // Update in uppercase collection if it exists
      await updateDoc(parkingSpaceUpperRef, updateData);
      console.log(`Updated parking space ${parkingSpaceId} (in ParkingSpaces) with new rating: ${newAverageRating} and feedback ID: ${feedbackId}`);
    } else {
      // Create the document if it doesn't exist in either collection
      console.log(`Parking space ${parkingSpaceId} not found, creating new document...`);
      
      // Get parking slot data to find parent information if available
      try {
        const slotRef = doc(db, 'ParkingSlots', 'parkingSlot123');
        const slotSnap = await getDoc(slotRef);
        
        // Basic parking space details to create
        const parkingSpaceData = {
          id: parkingSpaceId,
          averageRating: newAverageRating,
          totalFeedbacks: sentimentCounts.total,
          positiveFeedbacks: sentimentCounts.positive,
          neutralFeedbacks: sentimentCounts.neutral,
          negativeFeedbacks: sentimentCounts.negative,
          languageCounts: languageCounts,
          feedbackIds: [feedbackId], // Initialize with this feedback ID
          name: 'Parking Space', // Default name
          address: 'Unknown Address', // Default address
          spots: 0, // Default spots count
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };
        
        // If slot data exists, try to get more details
        if (slotSnap.exists()) {
          const slotData = slotSnap.data();
          if (slotData.name) parkingSpaceData.name = slotData.name;
          if (slotData.address) parkingSpaceData.address = slotData.address;
          
          // Count available spots
          try {
            let availableSpots = 0;
            Object.keys(slotData.levels || {}).forEach(levelKey => {
              const level = slotData.levels[levelKey];
              if (level && level.availability) {
                level.availability.forEach(row => {
                  row.cols.forEach(isAvailable => {
                    if (isAvailable) availableSpots++;
                  });
                });
              }
            });
            parkingSpaceData.spots = availableSpots;
          } catch (countError) {
            console.warn('Error counting available spots:', countError);
          }
        }
        
        // Use the parkingSpaces collection (lowercase) for consistency with the rest of the API
        await setDoc(doc(db, 'parkingSpaces', parkingSpaceId), parkingSpaceData);
        console.log(`Created new parking space document with ID: ${parkingSpaceId} including feedback ID: ${feedbackId}`);
      } catch (createError) {
        console.error('Error creating parking space document:', createError);
        // Still succeed with feedback submission even if space creation fails
      }
    }
    
    // Add feedback ID to user's profile
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update user document with new feedback ID
        await updateDoc(userRef, {
          feedbackIds: arrayUnion(feedbackId), // Add this feedback ID to the user's array
          lastActivityAt: serverTimestamp()
        });
        console.log(`Added feedback ID ${feedbackId} to user ${userId}`);
      } else {
        // User document doesn't exist yet, create it
        await setDoc(userRef, {
          id: userId,
          feedbackIds: [feedbackId],
          createdAt: serverTimestamp(),
          lastActivityAt: serverTimestamp()
        });
        console.log(`Created new user document with ID: ${userId} including feedback ID: ${feedbackId}`);
      }
    } catch (userError) {
      console.error('Error updating user document with feedback ID:', userError);
      // Continue even if user update fails
    }
    
    res.status(201).json({ 
      id: feedbackId,
      sentiment,
      language: detectedLanguage,
      averageRating: newAverageRating,
      message: 'Feedback saved successfully' 
    });
    
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

/**
 * Helper function to calculate average rating
 * @param {string} parkingSpaceId - ID of the parking space
 * @returns {Promise<number>} - Average rating (0-5)
 */
async function calculateAverageRating(parkingSpaceId) {
  const q = query(
    collection(db, 'feedbacks'),
    where('parkingSpaceId', '==', parkingSpaceId)
  );
  
  const querySnapshot = await getDocs(q);
  let totalRating = 0;
  let count = 0;
  
  querySnapshot.forEach((doc) => {
    totalRating += doc.data().rating;
    count++;
  });
  
  const averageRating = count > 0 ? totalRating / count : 0;
  
  // Round to 1 decimal place for display purposes
  return Math.round(averageRating * 10) / 10;
}

/**
 * Helper function to calculate feedback counts by sentiment
 * @param {string} parkingSpaceId - ID of the parking space
 * @returns {Promise<Object>} - Object with total, positive, neutral, and negative counts
 */
async function calculateSentimentCounts(parkingSpaceId) {
  const q = query(
    collection(db, 'feedbacks'),
    where('parkingSpaceId', '==', parkingSpaceId)
  );
  
  const querySnapshot = await getDocs(q);
  const counts = {
    total: querySnapshot.size,
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.sentiment === 'positive') counts.positive++;
    else if (data.sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  });
  
  return counts;
}

/**
 * Helper function to calculate feedback counts by language
 * @param {string} parkingSpaceId - ID of the parking space
 * @returns {Promise<Object>} - Object with counts per language
 */
async function calculateLanguageCounts(parkingSpaceId) {
  const q = query(
    collection(db, 'feedbacks'),
    where('parkingSpaceId', '==', parkingSpaceId)
  );
  
  const querySnapshot = await getDocs(q);
  const counts = {};
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const language = data.language || 'unknown';
    counts[language] = (counts[language] || 0) + 1;
  });
  
  return counts;
}

/**
 * Endpoint to get feedbacks by language for a parking space
 * GET /api/feedbacks/:parkingSpaceId?language=hi
 */
router.get('/feedbacks/:parkingSpaceId', async (req, res) => {
  try {
    const { parkingSpaceId } = req.params;
    const { language } = req.query;
    
    if (!parkingSpaceId) {
      return res.status(400).json({ error: 'Missing parking space ID' });
    }
    
    let q;
    
    if (language) {
      // Filter by both parking space ID and language
      q = query(
        collection(db, 'feedbacks'),
        where('parkingSpaceId', '==', parkingSpaceId),
        where('language', '==', language)
      );
    } else {
      // Filter by parking space ID only
      q = query(
        collection(db, 'feedbacks'),
        where('parkingSpaceId', '==', parkingSpaceId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const feedbacks = [];
    
    querySnapshot.forEach((doc) => {
      feedbacks.push(doc.data());
    });
    
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

export default router;