import cron from 'node-cron';
import { checkAvailabilityAndNotify } from './services/notificationService.js';

// Initialize scheduler function
const initializeScheduler = () => {
  console.log('Initializing notification scheduler...');
  
  // Run an initial check at startup
  setTimeout(async () => {
    console.log('Running initial notification check...');
    try {
      await checkAvailabilityAndNotify();
    } catch (error) {
      console.error('Error during initial notification check:', error);
    }
  }, 5000); // Wait 5 seconds after startup before first check
  
  // Schedule to run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled notification check...');
    try {
      await checkAvailabilityAndNotify();
    } catch (error) {
      console.error('Error during scheduled notification check:', error);
    }
  });
  
  console.log('Notification scheduler initialized - checking every 5 minutes');
};

export { initializeScheduler };