const { OpenAI } = require('openai');

const getGroq = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to your .env file.');
  }
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const chat = async (req, res, next) => {
  try {
    const groq = getGroq();
    const { messages } = req.body;
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are an AI Tutor named StudyBuddy. You help students learn by explaining concepts clearly, asking guiding questions, and formatting responses using Markdown.' },
        ...messages
      ],
      temperature: 0.7,
      stream: true,
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

const summarize = async (req, res, next) => {
  try {
    const groq = getGroq();
    const { notes } = req.body;
    
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are a highly skilled educational assistant. Your job is to take lengthy notes or transcripts and summarize them. Provide a concise summary, a list of key points, important definitions if any, and an exam tip. Use Markdown for formatting.' },
        { role: 'user', content: `Please summarize these notes:\n\n${notes}` }
      ],
      temperature: 0.5,
    });
    
    res.json({
      success: true,
      summary: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Summarize error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const quiz = async (req, res, next) => {
  try {
    const groq = getGroq();
    const { notes } = req.body;
    
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are a quiz generator. Based on the provided notes, generate a comprehensive quiz. Include 3 Multiple Choice Questions (with options A, B, C, D), 2 True/False questions, and 2 Short Answer questions. Provide the answer key at the very end. Format clearly using Markdown.' },
        { role: 'user', content: `Generate a quiz based on these notes:\n\n${notes}` }
      ],
      temperature: 0.7,
    });
    
    res.json({
      success: true,
      quiz: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Quiz error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const planner = async (req, res, next) => {
  try {
    const groq = getGroq();
    const { subject, date, hours } = req.body;
    
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: "You are a study planner assistant. Generate a realistic and structured study schedule based on the user's subject, exam date, and available weekly hours. Break it down by weeks or days leading up to the exam. Use Markdown." },
        { role: 'user', content: `Subject: ${subject}\nExam Date: ${date}\nAvailable Hours per week: ${hours}` }
      ],
      temperature: 0.7,
    });
    
    res.json({
      success: true,
      plan: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Planner error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  chat,
  summarize,
  quiz,
  planner
};
