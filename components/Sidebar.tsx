import React from 'react';
import { View } from '../App';
import { ChartPieIcon, VideoCameraIcon, BookOpenIcon, SparklesIcon, ChatBubbleLeftRightIcon, PhotoIcon, PlayIcon, Cog6ToothIcon, UserCircleIcon, CodeBracketIcon, SpeakerWaveIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems: { name: View; icon: React.ReactNode }[] = [
    { name: 'Dashboard', icon: <ChartPieIcon /> },
    { name: 'Analyze Video', icon: <VideoCameraIcon /> },
    { name: 'Live Workout', icon: <VideoCameraIcon /> },
    { name: 'Diet Planner', icon: <BookOpenIcon /> },
    { name: 'Recommendations', icon: <SparklesIcon /> },
    { name: 'AI Chatbot', icon: <ChatBubbleLeftRightIcon /> },
    { name: 'Voice Assistant', icon: <SpeakerWaveIcon /> },
    { name: 'Generate Content', icon: <PhotoIcon /> },
  ];
  
  const bottomItems: { name: string; icon: React.ReactNode }[] = [
    { name: 'Profile', icon: <UserCircleIcon /> },
    { name: 'Settings', icon: <Cog6ToothIcon /> },
    { name: 'Open Source', icon: <CodeBracketIcon /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col">
      <div className="h-20 flex items-center justify-center text-2xl font-bold border-b border-slate-700">
        <span className="text-sky-400 mr-2"><PlayIcon/></span>
        AI Fitness
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentView(item.name)}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
              currentView === item.name
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 mr-3">{item.icon}</span>
            <span className={item.name === 'Live Workout' ? 'text-sm' : ''}>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-slate-700 space-y-2">
          {bottomItems.map((item) => (
               <button key={item.name} className="w-full flex items-center px-4 py-3 text-left rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white">
                   <span className="w-6 h-6 mr-3">{item.icon}</span>
                   <span>{item.name}</span>
               </button>
          ))}
      </div>
    </aside>
  );
};

export default Sidebar;