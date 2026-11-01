const { createOpenRouterClient, getFriendlyErrorMessage } = require('../services/openrouter');

const CHAT_SYSTEM_PROMPT =
  'You are an AI Tutor named StudyBuddy. You help students learn by explaining concepts clearly, asking guiding questions, and formatting responses using Markdown.';
const SUMMARIZE_SYSTEM_PROMPT =
  'You are a highly skilled educational assistant. Your job is to take lengthy notes or transcripts and summarize them. Provide a concise summary, a list of key points, important definitions if any, and an exam tip. Use Markdown for formatting.';
const QUIZ_SYSTEM_PROMPT =
  'You are a quiz generator. Based on the provided notes, generate a comprehensive quiz. Include 3 Multiple Choice Questions (with options A, B, C, D), 2 True/False questions, and 2 Short Answer questions. Provide the answer key at the very end. Format clearly using Markdown.';
const PLANNER_SYSTEM_PROMPT =
  "You are a study planner assistant. Generate a realistic and structured study schedule based on the user's subject, exam date, and available weekly hours. Break it down by weeks or days leading up to the exam. Use Markdown.";

const normalizeContent = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') return part.text || part.content || '';
        return '';
      })
      .join('\n');
  }
  if (content && typeof content === 'object') {
    return content.text || content.content || JSON.stringify(content);
  }
  return '';
};

const buildChatMessages = (messages = []) => {
  const conversation = messages
    .filter((message) => message && typeof message === 'object'
      && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: normalizeContent(message.content),
    }));

  const firstUserMessage = conversation.findIndex((message) => message.role === 'user');
  return firstUserMessage === -1 ? [] : conversation.slice(firstUserMessage);
};

const createApiController = (client = createOpenRouterClient()) => {
  const respondWithError = (res, error, routeName) => {
    console.error(`${routeName} error:`, error?.code || 'AI_SERVICE_ERROR', error?.status || '');
    const message = getFriendlyErrorMessage(error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
      return;
    }
    res.status(503).json({ success: false, message });
  };

  const chat = async (req, res) => {
    try {
      const messages = buildChatMessages(req.body.messages);
      if (!messages.some((message) => message.role === 'user')) {
        return res.status(400).json({ success: false, message: 'A user message is required.' });
      }

      const stream = await client.openStream([
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...messages,
      ], { temperature: 0.7, max_tokens: 1200 });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const content of stream) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      respondWithError(res, error, 'Chat');
    }
  };

  const summarize = async (req, res) => {
    try {
      const summary = await client.complete([
        { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
        { role: 'user', content: `Please summarize these notes:\n\n${req.body.notes}` },
      ], { temperature: 0.5, max_tokens: 1600 });
      res.json({ success: true, summary });
    } catch (error) {
      respondWithError(res, error, 'Summarize');
    }
  };

  const quiz = async (req, res) => {
    try {
      const quizText = await client.complete([
        { role: 'system', content: QUIZ_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a quiz based on these notes:\n\n${req.body.notes}` },
      ], { temperature: 0.7, max_tokens: 1800 });
      res.json({ success: true, quiz: quizText });
    } catch (error) {
      respondWithError(res, error, 'Quiz');
    }
  };

  const planner = async (req, res) => {
    try {
      const plan = await client.complete([
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Subject: ${req.body.subject}\nExam Date: ${req.body.date}\nAvailable Hours per week: ${req.body.hours}`,
        },
      ], { temperature: 0.7, max_tokens: 1200 });
      res.json({ success: true, plan });
    } catch (error) {
      respondWithError(res, error, 'Planner');
    }
  };

  return { chat, summarize, quiz, planner };
};

const controller = createApiController();

module.exports = {
  ...controller,
  buildChatMessages,
  createApiController,
};
