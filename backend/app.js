import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import feedbackRoutes from './routes/feedbackRoutes.js';
import complaintsRoutes from './routes/complaintsRoutes.js';
import process from 'process';
import notificationRoutes from './routes/notifications.js';
import { initializeScheduler } from './scheduler.js';
import admin from 'firebase-admin';
import { startDataCollectionScheduler, runDataCollectionNow } from './schedulers/dataCollectionScheduler.js';
import predictionRoutes from './routes/predictionRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration with restricted origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin SDK initialized successfully with application default credentials');
  } catch (defaultCredError) {
    console.log('Fallback to environment variable configuration' , defaultCredError);
    // Fallback to environment variables
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin SDK initialized successfully with environment variables');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  }
}

// Routes
app.get('/', (req, res) => {
    res.send('Smart Parking Management Application backend!');
});

app.use('/api', feedbackRoutes);
app.use('/api', complaintsRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api', predictionRoutes);

// Initialize scheduler
initializeScheduler();

// Start the data collection scheduler when the server starts
const dataCollectionJob = startDataCollectionScheduler();

// Run an initial data collection to populate some data
// Comment this out if you don't want to run it immediately
runDataCollectionNow().catch(err => {
  console.error("Error running initial data collection:", err);
});

// Graceful shutdown to clean up scheduler
process.on('SIGINT', () => {
  console.log('Stopping data collection scheduler...');
  dataCollectionJob.cancel();
  // Other cleanup code...
  process.exit(0);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});