import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateQuiz } from '../api';

export default function Quiz() {
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setIsGenerating(true);
    setError('');
    
    try {
      const data = await generateQuiz(notes);
      if (data.success) {
        setQuiz(data.quiz);
      } else {
        setError(data.message || 'Failed to generate quiz.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while connecting to the server.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col items-center pb-8">
      {!quiz ? (
        <div className="w-full max-w-3xl text-center mt-12">
          <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-purple-500/20">
            <span className="text-4xl">📝</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Quiz Generator</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Upload your notes and let our AI generate multiple-choice, true/false, and short answer questions to test your knowledge.
          </p>
          <div className="bg-[#1e2030] p-8 rounded-2xl border border-slate-700/50 w-full glass shadow-xl">
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-40 bg-[#0f111a] border border-slate-700 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-purple-500 transition-colors mb-4 resize-none"
              placeholder="Paste topic or notes to generate quiz..."
            ></textarea>
            {error && <p className="text-red-400 mb-4 text-left">{error}</p>}
            <button 
              onClick={handleGenerate}
              disabled={!notes.trim() || isGenerating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20 flex justify-center items-center gap-2"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
              ) : 'Generate Quiz'}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-[#1e2030] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl glass mt-8">
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
            <h3 className="font-semibold text-white text-xl">Your AI Quiz</h3>
            <button onClick={() => setQuiz('')} className="text-sm text-purple-400 hover:text-purple-300">Start Over</button>
          </div>
          <div className="p-8 prose prose-invert max-w-none text-slate-300">
            <ReactMarkdown>{quiz}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
