import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, BookOpen, PenTool, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Tutor Chat',
    description: 'Get instant answers and explanations to complex topics.',
    icon: MessageSquare,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    link: '/chat'
  },
  {
    title: 'Notes Summarizer',
    description: 'Turn lengthy notes into bite-sized, easy to review key points.',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    link: '/summarizer'
  },
  {
    title: 'Quiz Generator',
    description: 'Test your knowledge with auto-generated quizzes from your notes.',
    icon: PenTool,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    link: '/quiz'
  },
  {
    title: 'Study Planner',
    description: 'Organize your study sessions and stay on track for exams.',
    icon: Calendar,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    link: '/planner'
  }
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto py-12">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
          Supercharge Your Learning with <span className="text-gradient">AI</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          StudyBuddy is your personal AI companion that helps you summarize notes, generate quizzes, plan your studies, and master any subject faster.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/chat" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/about" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
            Learn More
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Link to={feature.link} className="block group">
              <div className="glass-panel p-8 rounded-2xl h-full border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
