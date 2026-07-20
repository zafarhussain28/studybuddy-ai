import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, BookOpen, PenTool, Calendar, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'AI Tutor', icon: MessageSquare },
  { path: '/summarizer', label: 'Summarizer', icon: BookOpen },
  { path: '/quiz', label: 'Quiz Gen', icon: PenTool },
  { path: '/planner', label: 'Study Planner', icon: Calendar },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen border-r border-[#334155] glass flex-col fixed left-0 top-0 z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gradient">StudyBuddy</h1>
        <p className="text-sm text-slate-400 mt-1">AI-Powered Companion</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-sm text-slate-300">
          <p className="font-semibold text-white mb-1">Vibe Coding</p>
          <p className="text-xs">Assessment Project</p>
        </div>
      </div>
    </aside>
  );
}
