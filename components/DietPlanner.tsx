
import React, { useState, useCallback } from 'react';
import { generateDietPlan, textToSpeech } from '../services/geminiService';
import { DietPlan } from '../types';
import { SpeakerWaveIcon, CoffeeIcon, SunIcon, MoonIcon, BoltIcon } from './icons';

// Audio decoding and playback helper
const playAudio = async (base64Audio: string) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / 1;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
  
  const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};

const MealCard: React.FC<{ meal: string, name: string, icon: React.ReactNode }> = ({ meal, name, icon }) => (
    <div className="flex items-start space-x-3">
        <div className="text-sky-500 mt-1">{icon}</div>
        <div>
            <p className="font-semibold text-slate-800">{name}</p>
            <p className="text-slate-600">{meal}</p>
        </div>
    </div>
);


const DietPlanner: React.FC = () => {
    const [biography, setBiography] = useState('');
    const [goals, setGoals] = useState('');
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGeneratePlan = useCallback(async () => {
        if (!biography || !goals) {
            setError('Please fill in both your biography and fitness goals.');
            return;
        }

        setIsLoading(true);
        setError('');
        setDietPlan(null);

        try {
            const plan = await generateDietPlan(biography, goals);
            if (plan) {
                setDietPlan(plan);
            } else {
                setError('Could not generate a diet plan. The response might be invalid.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while generating the plan. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [biography, goals]);

    const handleReadAloud = useCallback(async () => {
      if (!dietPlan || isSpeaking) return;
      setIsSpeaking(true);
      try {
        const textToRead = `${dietPlan.title}. ${dietPlan.summary}`;
        const audioData = await textToSpeech(textToRead);
        if (audioData) {
          await playAudio(audioData);
        }
      } catch (err) {
        console.error("TTS Error:", err);
      } finally {
        setIsSpeaking(false);
      }
    }, [dietPlan, isSpeaking]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="w-full h-32 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                         <h1 className="text-3xl font-bold text-white drop-shadow-md">AI Diet Planner</h1>
                    </div>
                    <p className="text-slate-500 -mt-2">Enter your details and fitness goals to generate a personalized 7-day diet plan.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="biography" className="block text-sm font-medium text-slate-700">Your Biography</label>
                        <textarea
                            id="biography"
                            rows={4}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            placeholder="e.g., 30-year-old male, 80kg, 180cm, moderately active (gym 3 times a week), no allergies."
                            value={biography}
                            onChange={(e) => setBiography(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-slate-500">Include age, gender, weight, height, activity level, and any dietary restrictions.</p>
                    </div>
                    <div>
                        <label htmlFor="goals" className="block text-sm font-medium text-slate-700">Fitness Goals</label>
                        <textarea
                            id="goals"
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            placeholder="e.g., Lose 5kg in 2 months and build lean muscle."
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleGeneratePlan}
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Diet Plan'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
            </div>

            {dietPlan && (
                <div className="mt-8 pt-6">
                    <div className="text-center bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6">
                        <div className="flex justify-center items-center mb-4">
                            <h2 className="text-2xl font-bold text-slate-800">{dietPlan.title}</h2>
                            <button onClick={handleReadAloud} disabled={isSpeaking} className="ml-4 flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-100 rounded-full hover:bg-sky-200 disabled:opacity-50">
                              <SpeakerWaveIcon />
                              <span>{isSpeaking ? 'Reading...' : 'Read'}</span>
                            </button>
                        </div>
                        <p className="text-slate-600 italic max-w-2xl mx-auto">{dietPlan.summary}</p>
                    </div>
                    <div className="space-y-6">
                        {dietPlan.daily_plans.map(dayPlan => (
                            <div key={dayPlan.day} className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                                <h3 className="font-bold text-xl text-slate-700 border-b pb-2 mb-4">{dayPlan.day}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <MealCard name="Breakfast" meal={dayPlan.meals.breakfast} icon={<CoffeeIcon />} />
                                    <MealCard name="Lunch" meal={dayPlan.meals.lunch} icon={<SunIcon />} />
                                    <MealCard name="Dinner" meal={dayPlan.meals.dinner} icon={<MoonIcon />} />
                                    <MealCard name="Snacks" meal={dayPlan.meals.snacks} icon={<BoltIcon />} />
                                </div>
                                {dayPlan.notes && <p className="mt-4 text-xs text-slate-500 italic border-t pt-3"><strong>Note:</strong> {dayPlan.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietPlanner;
