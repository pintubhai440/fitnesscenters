import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const LiveWorkout: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [exerciseType, setExerciseType] = useState<string>('');
    const [parsedResult, setParsedResult] = useState<ParsedAnalysis | null>(null);
    const [error, setError] = useState<string>('');
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to get media stream", err);
                setError("Camera and microphone access denied. Please enable permissions.");
            }
        };
        getMedia();

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    
    useEffect(() => {
        // Clean up the object URL to avoid memory leaks
        return () => {
            if (recordedVideoUrl) {
                URL.revokeObjectURL(recordedVideoUrl);
            }
        };
    }, [recordedVideoUrl]);

    const startRecording = () => {
        if (videoRef.current?.srcObject) {
            setError('');
            setParsedResult(null);
            if(recordedVideoUrl) {
                URL.revokeObjectURL(recordedVideoUrl);
                setRecordedVideoUrl(null);
            }
            const stream = videoRef.current.srcObject as MediaStream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = handleAnalyze;
            recordedChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } else {
            setError("Cannot start recording. Media stream not available.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve((reader.result as string).split(',')[1]);
            };
            reader.onerror = (error) => reject(error);
        });
    };
    
    const handleAnalyze = useCallback(async () => {
        if (recordedChunksRef.current.length === 0) {
            console.log("No chunks recorded");
            return;
        }
        if (!exerciseType) {
            setError('Please select an exercise before starting the recording.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        
        try {
            const base64Video = await blobToBase64(blob);
            const result = await analyzeVideo(base64Video, blob.type, exerciseType);
            setParsedResult(parseAnalysisResult(result));
        } catch (err) {
            console.error(err);
            setError('An error occurred during analysis. Please try again.');
        } finally {
            setIsLoading(false);
            recordedChunksRef.current = [];
        }
    }, [exerciseType]);
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Live Workout Analysis</h1>
                    <p className="text-slate-500 mt-2">Record your exercise, and get instant AI feedback.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        {isRecording && (
                             <div className="absolute top-3 left-3 flex items-center space-x-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-sm">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
                                <span>REC</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="exercise-type" className="block text-sm font-medium text-slate-700">Select Exercise</label>
                            <select id="exercise-type" value={exerciseType} onChange={e => setExerciseType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                                <option value="">-- Select an exercise --</option>
                                {EXERCISE_TYPES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!exerciseType || isLoading}
                            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                                ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'}
                                disabled:bg-slate-400 disabled:cursor-not-allowed`}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
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
                <div className="mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {recordedVideoUrl && (
                             <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-700 mb-3">Your Recorded Workout</h3>
                                <video src={recordedVideoUrl} controls className="w-full rounded-lg aspect-video"></video>
                            </div>
                        )}
                         <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center flex flex-col justify-center">
                            <h3 className="text-lg font-semibold text-slate-500">Repetition Count</h3>
                            <p className="text-6xl font-bold text-sky-600 my-3">{parsedResult.repCount}</p>
                        </div>
                    </div>
                    <div className="mt-6 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Form Assessment</h3>
                        <ul className="space-y-2">
                            {parsedResult.assessment.map((item, i) => <li key={i} className="flex items-start"><span className="text-red-500 mr-3 mt-1">✖</span><span className="text-slate-600">{item}</span></li>)}
                        </ul>
                    </div>
                     <div className="mt-6 bg-white p-6 rounded-xl shadow-md border border-slate-200">
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

export default LiveWorkout;