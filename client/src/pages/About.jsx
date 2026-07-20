export default function About() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="glass-panel p-10 rounded-3xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
        <h2 className="text-3xl font-bold text-white mb-6">About StudyBuddy AI</h2>
        <div className="space-y-4 text-slate-300 text-lg leading-relaxed relative z-10">
          <p>
            StudyBuddy AI was built as a capstone project for the Vibe Coding Masterclass Assessment. 
            It leverages modern web technologies and Large Language Models to provide an unparalleled 
            learning experience.
          </p>
          <p>
            Our mission is to help students, self-learners, and professionals accelerate their 
            learning by providing smart, AI-driven tools that summarize content, test knowledge, 
            and keep study schedules on track.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Tech Stack</h3>
            <ul className="grid grid-cols-2 gap-4 text-sm">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> React 19</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Vite</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> TailwindCSS v4</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Framer Motion</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Node.js & Express</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> OpenAI SDK</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
