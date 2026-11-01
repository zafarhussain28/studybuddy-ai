const { GoogleGenAI } = require('@google/genai');

const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.');
  }

  return new GoogleGenAI({ apiKey: key });
};

const GEMINI_MODEL = 'gemini-3.8-flash';

const normalizeContent = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          return part.text || part.content || '';
        }
        return '';
      })
      .join('\n');
  }

  if (content && typeof content === 'object') {
    return content.text || content.content || JSON.stringify(content);
  }

  return '';
};

const buildGeminiMessages = (messages = []) => {
  const contents = messages
    .filter((msg) => msg && typeof msg === 'object' && (msg.role === 'user' || msg.role === 'assistant'))
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: normalizeContent(msg.content) }],
    }));

  const firstUserMessage = contents.findIndex((message) => message.role === 'user');
  return firstUserMessage === -1 ? [] : contents.slice(firstUserMessage);
};

const chat = async (req, res, next) => {
  try {
    const ai = getGemini();
    const { messages = [] } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: buildGeminiMessages(messages),
      config: {
        systemInstruction:
          'You are an AI Tutor named StudyBuddy. You help students learn by explaining concepts clearly, asking guiding questions, and formatting responses using Markdown.',
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      const content = chunk?.text || '';
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
    const ai = getGemini();
    const { notes } = req.body;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Please summarize these notes:\n\n${notes}` }],
      }],
      config: {
        systemInstruction:
          'You are a highly skilled educational assistant. Your job is to take lengthy notes or transcripts and summarize them. Provide a concise summary, a list of key points, important definitions if any, and an exam tip. Use Markdown for formatting.',
        temperature: 0.5,
      },
    });

    res.json({
      success: true,
      summary: response.text,
    });
  } catch (error) {
    console.error('Summarize error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const quiz = async (req, res, next) => {
  try {
    const ai = getGemini();
    const { notes } = req.body;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a quiz based on these notes:\n\n${notes}` }],
      }],
      config: {
        systemInstruction:
          'You are a quiz generator. Based on the provided notes, generate a comprehensive quiz. Include 3 Multiple Choice Questions (with options A, B, C, D), 2 True/False questions, and 2 Short Answer questions. Provide the answer key at the very end. Format clearly using Markdown.',
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      quiz: response.text,
    });
  } catch (error) {
    console.error('Quiz error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const planner = async (req, res, next) => {
  try {
    const ai = getGemini();
    const { subject, date, hours } = req.body;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [{ text: `Subject: ${subject}\nExam Date: ${date}\nAvailable Hours per week: ${hours}` }],
      }],
      config: {
        systemInstruction:
          "You are a study planner assistant. Generate a realistic and structured study schedule based on the user's subject, exam date, and available weekly hours. Break it down by weeks or days leading up to the exam. Use Markdown.",
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      plan: response.text,
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
  planner,
  buildGeminiMessages,
};
