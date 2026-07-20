import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summarizeNotes } from '../api';

export default function Summarizer() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setIsGenerating(true);
    setError('');
    
    try {
      const data = await summarizeNotes(notes);
      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.message || 'Failed to generate summary.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while connecting to the server.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-6 pb-6">
      <div className="flex-1 flex flex-col bg-[#1e2030] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white">Your Notes</h3>
        </div>
        <textarea
          className="flex-1 w-full p-6 bg-transparent text-slate-300 resize-none focus:outline-none"
          placeholder="Paste your lengthy notes, transcripts, or articles here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
          <span className="text-red-400 text-sm">{error}</span>
          <button 
            onClick={handleSummarize}
            disabled={!notes.trim() || isGenerating}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ml-auto shadow-lg shadow-emerald-500/20"
          >
            {isGenerating ? 'Generating...' : 'Summarize Notes'} <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#1e2030]/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl glass">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">AI Summary</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Analyzing and summarizing your notes...</p>
            </div>
          ) : summary ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="prose prose-invert max-w-none text-slate-300"
            >
              <ReactMarkdown>{summary}</ReactMarkdown>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <BookOpen className="w-16 h-16 opacity-20" />
              <p>Paste your notes and click summarize to see the magic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
