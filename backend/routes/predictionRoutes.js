import express from 'express';
import { predictParkingAvailability } from '../services/parkingPredictionService.js';

const router = express.Router();

/**
 * GET /api/predictions/:parkingSpaceId
 * Get predicted availability for a parking space
 */
router.get('/predictions/:parkingSpaceId', async (req, res) => {
  const { parkingSpaceId } = req.params;
  const { date, time } = req.query;
  
  console.log(`Prediction request received for space: ${parkingSpaceId}`);
  console.log(`Date: ${date}, Time: ${time}`);
  
  try {
    if (!parkingSpaceId) {
      return res.status(400).json({ error: 'Parking space ID is required' });
    }
    
    // Parse the target date and time
    let targetDate;
    if (date && time) {
      targetDate = new Date(`${date}T${time}`);
    } else {
      // Default to current time + 1 hour if no date/time provided
      targetDate = new Date();
      targetDate.setHours(targetDate.getHours() + 1);
    }
    
    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date or time format' });
    }
    
    const prediction = await predictParkingAvailability(parkingSpaceId, targetDate);
    
    res.status(200).json(prediction);
  } catch (error) {
    console.error('Error getting prediction:', error);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
});

export default router;