import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Smart Parking Management Application backend!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:3000`);
});