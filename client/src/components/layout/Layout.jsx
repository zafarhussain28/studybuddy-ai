import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#0f111a] text-slate-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col h-full relative">
        {/* Background ambient light effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        
        <Header />
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
