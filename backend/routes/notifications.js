import express from 'express';
import { checkAvailabilityAndNotify } from '../services/notificationService.js';
// Temporarily comment out the auth middleware until we get it working
// import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint for testing notifications
router.get('/test', async (req, res) => {
  try {
    const result = await checkAvailabilityAndNotify();
    res.json({ success: true, message: 'Test notification check completed', result });
  } catch (error) {
    console.error('Error in test notification endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comment out the secured endpoint for now
/*
router.post('/check-availability', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await checkAvailabilityAndNotify();
    res.json(result);
  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
*/

// For testing - public endpoint that doesn't require authentication
router.get('/status', async (req, res) => {
  res.json({ status: 'Notification service active' });
});

export default router;