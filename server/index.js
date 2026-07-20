require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON bodies

// API Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static frontend files in production (for Docker)
// Only serve if the public directory exists
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`GROQ_API_KEY is ${process.env.GROQ_API_KEY ? 'SET' : 'NOT SET (features will fail)'}`);});
