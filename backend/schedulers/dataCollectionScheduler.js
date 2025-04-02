import schedule from 'node-schedule';
import { collectParkingData } from '../services/parkingDataCollectionService.js';

/**
 * Start the scheduler to collect parking data at regular intervals
 */
export const startDataCollectionScheduler = () => {
  // Schedule to run every hour (at minute 0)
  const job = schedule.scheduleJob('0 * * * *', async function() {
    console.log('Running scheduled parking data collection at', new Date().toISOString());
    await collectParkingData();
  });
  
  console.log('Parking data collection scheduler started');
  return job;
};

/**
 * Run data collection immediately once (useful for initial data population)
 */
export const runDataCollectionNow = async () => {
  console.log('Running immediate parking data collection');
  await collectParkingData();
};