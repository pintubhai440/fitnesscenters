import React, { useState, useCallback, useEffect } from 'react';
import { analyzeVideo } from '../services/geminiService';

const EXERCISE_TYPES = ["Push-up", "Squat", "Jumping Jack", "Lunge", "Burpee"];

interface ParsedAnalysis {
  repCount: string;
  assessment: string[];
  tips: string[];
}

const parseAnalysisResult = (markdown: string): ParsedAnalysis => {
    const repCountMatch = markdown.match(/### Repetition Count\s*([\s\S]*?)\s*(?=###|$)/);
    const assessmentMatch = markdown.match(/### Form Assessment\s*([\s\S]*?)\s*(?=###|$)/);
    const tipsMatch = markdown.match(/### Tips for Improvement\s*([\s\S]*?)(?=$)/);

    const repCount = repCountMatch ? repCountMatch[1].trim() : 'N/A';
    
    const parseList = (section: string | null): string[] => {
        if (!section) return [];
        return section.trim().split('\n').map(item => item.replace(/^- /, '').trim()).filter(Boolean);
    }

    const assessment = parseList(assessmentMatch ? assessmentMatch[1] : null);
    const tips = parseList(tipsMatch ? tipsMatch[1] : null);

    return { repCount, assessment, tips };
};


const AnalyzeVideo: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [exerciseType, setExerciseType] = useState<string>('');
    const [parsedResult, setParsedResult] = useState<ParsedAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setError('File is too large. Please upload a video under 50MB.');
                return;
            }
            setVideoFile(file);
            setParsedResult(null);
            setError('');
            const url = URL.createObjectURL(file);
            setVideoPreviewUrl(url);
        }
    };
    
    useEffect(() => {
        return () => {
            if (videoPreviewUrl) {
                URL.revokeObjectURL(videoPreviewUrl);
            }
        }
    }, [videoPreviewUrl]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = (reader.result as string).split(',')[1];
                resolve(result);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleAnalyze = useCallback(async () => {
        if (!videoFile) {
            setError('Please upload a video to analyze.');
            return;
        }
        if (!exerciseType) {
            setError('Please select the exercise you are performing.');
            return;
        }

        setIsLoading(true);
        setError('');
        setParsedResult(null);

        try {
            const base64Video = await fileToBase64(videoFile);
            const result = await analyzeVideo(base64Video, videoFile.type, exerciseType);
            setParsedResult(parseAnalysisResult(result));
        } catch (err) {
            console.error(err);
            setError('An error occurred during analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [videoFile, exerciseType]);

    return (
        <div className="max-w-5xl mx-auto">
             <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <div className="text-center mb-8">
                     <div className="w-full h-32 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                         <h1 className="text-3xl font-bold text-white drop-shadow-md">Exercise Form Analysis</h1>
                    </div>
                    <p className="text-slate-500 -mt-2">Upload a video, select your exercise, and get instant AI feedback.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">1. Upload Video</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    <div className="flex text-sm text-slate-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500"><span>Upload a file</span><input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} /></label><p className="pl-1">or drag and drop</p></div>
                                    <p className="text-xs text-slate-500">{videoFile ? videoFile.name : 'MP4, WebM up to 50MB'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="exercise-type" className="block text-sm font-medium text-slate-700">2. Select Exercise</label>
                            <select id="exercise-type" value={exerciseType} onChange={e => setExerciseType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                                <option value="">-- Select an exercise --</option>
                                {EXERCISE_TYPES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                            </select>
                        </div>

                        <button onClick={handleAnalyze} disabled={isLoading || !videoFile || !exerciseType} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                            {isLoading ? 'Analyzing...' : 'Analyze My Form'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Video Preview</label>
                        <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center shadow-inner">
                            {videoPreviewUrl ? (
                                <video src={videoPreviewUrl} controls className="w-full h-full rounded-lg" />
                            ) : (
                                <p className="text-slate-500">Your video will appear here</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">AI is analyzing your form, please wait...</p>
                </div>
            )}

            {parsedResult && (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center">
                        <h3 className="text-lg font-semibold text-slate-500">Repetition Count</h3>
                        <p className="text-6xl font-bold text-sky-600 my-3">{parsedResult.repCount}</p>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Form Assessment</h3>
                        <ul className="space-y-2">
                            {parsedResult.assessment.map((item, i) => <li key={i} className="flex items-start"><span className="text-red-500 mr-3 mt-1">✖</span><span className="text-slate-600">{item}</span></li>)}
                        </ul>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 lg:col-span-3">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Tips for Improvement</h3>
                         <ul className="space-y-2">
                            {parsedResult.tips.map((item, i) => <li key={i} className="flex items-start"><span className="text-green-500 mr-3 mt-1">✔</span><span className="text-slate-600">{item}</span></li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzeVideo;