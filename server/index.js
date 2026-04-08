const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route for Render deployment to succeed
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Aura Assist Backend is running!' });
});

// Mock routes placeholder (to be handled by Backend members)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
