import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import feedbackRoutes from './routes/feedbackRoutes.js';
import complaintsRoutes from './routes/complaintsRoutes.js'; // Import the new routes
import process from 'process';

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

// Routes
app.get('/', (req, res) => {
    res.send('Smart Parking Management Application backend!');
});

app.use('/api', feedbackRoutes);
app.use('/api', complaintsRoutes); // Add the complaints routes

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});