import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalyzeVideo from './components/AnalyzeVideo';
import LiveWorkout from './components/LiveWorkout';
import DietPlanner from './components/DietPlanner';
import Recommendations from './components/Recommendations';
import AiChatbot from './components/AiChatbot';
import GenerateContent from './components/GenerateContent';
import VoiceAssistant from './components/VoiceAssistant';

export type View = 'Dashboard' | 'Analyze Video' | 'Live Workout' | 'Diet Planner' | 'Recommendations' | 'AI Chatbot' | 'Voice Assistant' | 'Generate Content';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Analyze Video':
        return <AnalyzeVideo />;
      case 'Live Workout':
        return <LiveWorkout />;
      case 'Diet Planner':
        return <DietPlanner />;
      case 'Recommendations':
        return <Recommendations />;
      case 'AI Chatbot':
        return <AiChatbot />;
      case 'Voice Assistant':
        return <VoiceAssistant />;
      case 'Generate Content':
        return <GenerateContent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto bg-sky-100/50 p-4 sm:p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;