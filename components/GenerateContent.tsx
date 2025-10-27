
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

const GenerateContent: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setImage(null);
        try {
            const imageData = await generateImage(prompt, aspectRatio);
            if (imageData) {
                setImage(`data:image/jpeg;base64,${imageData}`);
            }
        } catch (e) {
            console.error(e);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Generate AI Image</h1>
                <p className="text-slate-500 mt-2">Create motivational images or exercise visualizations with AI.</p>
            </div>
            <div className="space-y-6">
                <div>
                    <label htmlFor="img-prompt" className="block text-sm font-medium text-slate-700">Prompt</label>
                    <textarea id="img-prompt" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="e.g., A majestic eagle soaring over a mountain range, fitness motivation." />
                </div>
                <div>
                    <label htmlFor="aspect-ratio" className="block text-sm font-medium text-slate-700">Aspect Ratio</label>
                    <select id="aspect-ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                        <option>1:1</option>
                        <option>16:9</option>
                        <option>9:16</option>
                        <option>4:3</option>
                        <option>3:4</option>
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400">
                    {isLoading ? 'Generating Image...' : 'Generate Image'}
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {image && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold text-slate-700 text-center">Result:</h3>
                        <div className="flex justify-center mt-4">
                             <img src={image} alt={prompt} className="rounded-lg shadow-lg max-w-full h-auto" style={{maxWidth: '512px'}} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default GenerateContent;
