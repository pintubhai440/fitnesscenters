import React from 'react';
import { View } from '../App';
import { ArrowTrendingUpIcon, CalendarDaysIcon, ClipboardDocumentListIcon, FireIcon, MicrophoneIcon, VideoCameraIcon, BookOpenIcon, SparklesIcon } from './icons';

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, progress }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80">
        <div className="flex justify-between items-center mb-1">
            <span className="text-slate-500 text-sm font-medium">{title}</span>
            <span className="text-slate-400">{icon}</span>
        </div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {progress !== undefined ? (
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        ) : (
            <p className="text-slate-500 text-xs mt-1">{description}</p>
        )}
    </div>
);


const ActivityChart: React.FC = () => {
    const data = [
        { day: 'Mon', pushups: 58, squats: 45 },
        { day: 'Tue', squats: 55, pushups: 78 },
        { day: 'Wed', pushups: 62, squats: 68 },
        { day: 'Thu', squats: 70, pushups: 81 },
        { day: 'Fri', pushups: 75, squats: 65 },
        { day: 'Sat', pushups: 68, squats: 85 },
        { day: 'Sun', squats: 92, pushups: 86 },
    ];
    const maxVal = 100;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-bold text-slate-800">Weekly Activity</h3>
            <p className="text-sm text-slate-500 mb-4">Your push-up and squat progress over the last 7 days.</p>
            <div className="flex justify-between items-end h-48 space-x-2 sm:space-x-3">
                {data.map(d => (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="flex items-end justify-center w-full h-full space-x-1">
                            <div
                                className="w-1/2 bg-sky-400 rounded-t-sm hover:bg-sky-500 transition-all"
                                style={{ height: `${(d.pushups / maxVal) * 100}%` }}
                                title={`Push-ups: ${d.pushups} reps`}
                            ></div>
                            <div
                                className="w-1/2 bg-indigo-400 rounded-t-sm hover:bg-indigo-500 transition-all"
                                style={{ height: `${(d.squats / maxVal) * 100}%` }}
                                title={`Squats: ${d.squats} reps`}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-500 mt-2">{d.day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuickActions: React.FC = () => {
    const actions = [
        { name: 'Live Session', description: 'Start a real-time workout.', icon: <MicrophoneIcon /> },
        { name: 'Analyze Video', description: 'Get feedback on a recorded workout.', icon: <VideoCameraIcon /> },
        { name: 'Diet Plan', description: 'Generate your weekly meal plan.', icon: <BookOpenIcon /> },
        { name: 'Recommendations', description: 'Discover new workout videos.', icon: <SparklesIcon /> },
    ]
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            <p className="text-sm text-slate-500 mb-4">Jump right into your next fitness activity.</p>
            <div className="space-y-3">
                {actions.map(action => (
                    <button key={action.name} className="w-full flex items-center p-3 text-left bg-slate-50 hover:bg-sky-100/80 rounded-md border border-slate-200 transition-colors">
                       <div className="text-slate-500 mr-4">{action.icon}</div>
                        <div>
                            <p className="font-semibold text-slate-700">{action.name}</p>
                            <p className="text-xs text-slate-500">{action.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Reps" value="1,234" description="+20.1% from last week" icon={<ArrowTrendingUpIcon />} />
                <StatCard title="Active Days" value="5/7" description="This week" icon={<CalendarDaysIcon />} />
                <StatCard title="Weekly Goal" value="75%" description="" icon={<ClipboardDocumentListIcon />} progress={75} />
                <StatCard title="Streak" value="14 Days" description="Keep it up!" icon={<FireIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ActivityChart />
                </div>
                <div className="lg:col-span-1">
                    <QuickActions />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
