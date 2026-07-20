import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatWithAI = async (messages) => {
  const response = await api.post('/chat', { messages });
  return response.data;
};

export const summarizeNotes = async (notes) => {
  const response = await api.post('/summarize', { notes });
  return response.data;
};

export const generateQuiz = async (notes) => {
  const response = await api.post('/quiz', { notes });
  return response.data;
};

export const generateStudyPlan = async (subject, date, hours) => {
  const response = await api.post('/planner', { subject, date, hours });
  return response.data;
};

export default api;
