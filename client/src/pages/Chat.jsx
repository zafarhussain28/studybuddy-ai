import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { chatWithAI } from '../api';

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Tutor. How can I help you study today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const payloadMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      });

      // If the server returned an error (e.g. missing API key), parse JSON error
      if (!response.ok) {
        let errorMsg = 'Server returned an error.';
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch (e) { /* ignore parse error */ }
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${errorMsg}` }]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let aiResponseText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsLoading(false); // Stop loading animation since stream started

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  aiResponseText += data.content;
                  setMessages(prev => {
                    const newArray = [...prev];
                    newArray[newArray.length - 1] = { ...newArray[newArray.length - 1], content: aiResponseText };
                    return newArray;
                  });
                }
                if (data.error) {
                  setMessages(prev => {
                    const newArray = [...prev];
                    newArray[newArray.length - 1] = { ...newArray[newArray.length - 1], content: `**Error:** ${data.error}` };
                    return newArray;
                  });
                }
              } catch (e) {
                // ignore parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '**Error:** Could not reach the AI server. Make sure the backend is running on port 5000.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 mb-6">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-slate-800/30 p-6 rounded-2xl glass border border-slate-700/50' : 'px-6'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
              {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="prose prose-invert max-w-none text-slate-300">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'assistant' && idx > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1" 
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 bg-slate-800/30 p-6 rounded-2xl glass border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="w-full bg-[#1e2030] border border-slate-700 text-white rounded-xl py-4 pl-6 pr-14 focus:outline-none focus:border-indigo-500 transition-colors shadow-lg"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
