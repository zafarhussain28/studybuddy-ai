import { User, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  
  // Basic route to title mapping
  const titles = {
    '/': 'Dashboard',
    '/chat': 'AI Tutor',
    '/summarizer': 'Notes Summarizer',
    '/quiz': 'Quiz Generator',
    '/planner': 'Study Planner',
    '/about': 'About',
  };

  const currentTitle = titles[location.pathname] || 'StudyBuddy AI';

  return (
    <header className="h-16 shrink-0 border-b border-[#334155] glass z-30 flex items-center justify-between px-8">
      <h2 className="text-xl font-semibold text-white">{currentTitle}</h2>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-[#334155]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white shadow-lg">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-sm text-left">
            <p className="text-slate-200 font-medium leading-tight">Student</p>
            <p className="text-slate-500 text-xs">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
