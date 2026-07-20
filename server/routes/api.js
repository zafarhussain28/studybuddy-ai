const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');

// Input validation middleware placeholders
const validateChatInput = (req, res, next) => {
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return res.status(400).json({ success: false, message: 'Messages array is required.' });
  }
  next();
};

const validateSummarizeInput = (req, res, next) => {
  if (!req.body.notes || typeof req.body.notes !== 'string') {
    return res.status(400).json({ success: false, message: 'Notes string is required.' });
  }
  next();
};

const validateQuizInput = (req, res, next) => {
  if (!req.body.notes || typeof req.body.notes !== 'string') {
    return res.status(400).json({ success: false, message: 'Notes string is required for quiz generation.' });
  }
  next();
};

const validatePlannerInput = (req, res, next) => {
  const { subject, date, hours } = req.body;
  if (!subject || !date || !hours) {
    return res.status(400).json({ success: false, message: 'Subject, date, and hours are required.' });
  }
  next();
};

// Routes
router.post('/chat', validateChatInput, apiController.chat);
router.post('/summarize', validateSummarizeInput, apiController.summarize);
router.post('/quiz', validateQuizInput, apiController.quiz);
router.post('/planner', validatePlannerInput, apiController.planner);

module.exports = router;
