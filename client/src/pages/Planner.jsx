import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateStudyPlan } from '../api';

export default function Planner() {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [plan, setPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!subject || !date || !hours) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const data = await generateStudyPlan(subject, date, hours);
      if (data.success) {
        setPlan(data.plan);
      } else {
        setError(data.message || 'Failed to generate study plan.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while connecting to the server.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col items-center pb-8">
      {!plan ? (
        <div className="w-full max-w-3xl text-center mt-12">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-amber-500/20">
            <span className="text-4xl">📅</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Study Planner</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Enter your exam date, subject, and available study hours. AI will generate a personalized study schedule just for you.
          </p>
          <div className="bg-[#1e2030] p-8 rounded-2xl border border-slate-700/50 w-full max-w-md mx-auto glass shadow-xl flex flex-col gap-5 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject / Exam Topic</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0f111a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" 
                placeholder="e.g. Advanced Calculus" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Exam Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0f111a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Available Hours per Week</label>
              <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-[#0f111a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" 
                placeholder="e.g. 10" 
              />
            </div>
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 mt-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
              ) : 'Generate Study Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-[#1e2030] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl glass mt-8">
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
            <h3 className="font-semibold text-white text-xl">Your Personalized Schedule</h3>
            <button onClick={() => setPlan('')} className="text-sm text-amber-400 hover:text-amber-300">Create New Plan</button>
          </div>
          <div className="p-8 prose prose-invert max-w-none text-slate-300">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
