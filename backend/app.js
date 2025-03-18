import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import feedbackRoutes from './routes/feedbackRoutes.js';
import process from 'process';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Smart Parking Management Application backend!');
});

app.use('/api', feedbackRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});