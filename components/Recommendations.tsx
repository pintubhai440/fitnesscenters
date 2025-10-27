

import React, { useState, useCallback } from 'react';
import { getRecommendations } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

// Fix: Updated GroundingChunk to align with the library's type definition where `web` and its properties can be optional.
interface GroundingChunk {
    web?: {
        uri?: string;
        title?: string;
    }
}

const Recommendations: React.FC = () => {
    const [profile, setProfile] = useState('');
    const [goals, setGoals] = useState('');
    const [response, setResponse] = useState<GenerateContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGetRecommendations = useCallback(async () => {
        if (!profile || !goals) {
            setError('Please fill in both your profile and goals.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResponse(null);

        try {
            const result = await getRecommendations(profile, goals);
            setResponse(result);
        } catch (err) {
            console.error(err);
            setError('An error occurred while fetching recommendations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [profile, goals]);
    
    const groundingChunks: GroundingChunk[] = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Get Recommendations</h1>
                <p className="text-slate-500 mt-2">Describe your profile and goals to get tailored YouTube video recommendations.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="profile" className="block text-sm font-medium text-slate-700">Your Profile</label>
                    <textarea
                        id="profile"
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="e.g., 25-year-old female, beginner at weightlifting, has access to dumbbells."
                        value={profile}
                        onChange={(e) => setProfile(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="goals" className="block text-sm font-medium text-slate-700">Fitness Goals</label>
                    <textarea
                        id="goals"
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="e.g., Build upper body strength, improve cardio."
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleGetRecommendations}
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Searching...' : 'Get Recommendations'}
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>

            {groundingChunks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Here are your recommended videos:</h2>
                    <div className="space-y-3">
                        {groundingChunks.map((chunk, index) => (
                             // Fix: Added a check for chunk.web and chunk.web.uri before rendering the link to prevent runtime errors.
                             chunk.web?.uri && (
                                <a 
                                    key={index} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="block p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-colors"
                                >
                                    <p className="font-semibold text-sky-700">{chunk.web.title || "Untitled Video"}</p>
                                    <p className="text-xs text-slate-500 truncate">{chunk.web.uri}</p>
                                </a>
                             )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations;