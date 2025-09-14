
import React, { useState, useCallback, useEffect } from 'react';
import type { Record, ActionItem } from '../types';
import { analyzeTextWithGemini } from '../services/geminiService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import AudioVisualizer from './AudioVisualizer';

interface AddVoiceRecordModalProps {
    onClose: () => void;
    onSave: (record: Record) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};


const AddVoiceRecordModal: React.FC<AddVoiceRecordModalProps> = ({ onClose, onSave }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const {
        permission,
        recordingStatus,
        transcript,
        audioBlob,
        stream,
        elapsedTime,
        error,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
    } = useAudioRecorder();

    useEffect(() => {
       if (permission && recordingStatus === 'inactive') {
           startRecording();
       }
    }, [permission, recordingStatus, startRecording]);

    const handleSave = useCallback(async () => {
        if (!transcript.trim() || !audioBlob) return;

        setIsAnalyzing(true);
        try {
            const analysis = await analyzeTextWithGemini(transcript);
            const audioUrl = URL.createObjectURL(audioBlob);
            const recordId = crypto.randomUUID();
            const newRecord: Record = {
                id: recordId,
                type: 'voice',
                content: transcript,
                timestamp: new Date().toISOString(),
                tags: analysis.tags,
                actionItems: analysis.actionItems.map((item) => ({
                    id: crypto.randomUUID(),
                    ...item,
                    status: 'todo',
                    subtasks: [],
                    recordId: recordId,
                    priority: item.priority || 'medium',
                })),
                audioUrl: audioUrl,
            };
            onSave(newRecord);
        } catch (error) {
            console.error("Failed to save record with AI analysis:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [transcript, audioBlob, onSave]);
    
    const isProcessing = recordingStatus === 'stopping' || isAnalyzing;
    const hasError = error !== null;

    const renderVisualizerArea = () => {
        if (recordingStatus === 'recording') {
            return <AudioVisualizer stream={stream} />;
        }
    
        let statusText = '准备中...';
        if (recordingStatus === 'paused') {
            statusText = '已暂停';
        } else if (recordingStatus === 'stopping') {
            statusText = '处理音频...';
        } else if (recordingStatus === 'inactive' && audioBlob) {
            statusText = '录音完成，可以保存。';
        }
    
        return (
            <div className="h-[100px] w-full bg-base-100 rounded-xl flex items-center justify-center border border-base-300">
                <p className="text-text-secondary">{statusText}</p>
            </div>
        );
    };

    const renderContent = () => {
        if (hasError) {
            return (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto text-red-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.007H12v-.007z" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-red-500">发生错误</h3>
                    <p className="mt-1 text-sm text-text-secondary">{error}</p>
                </div>
            );
        }
        if (!permission) {
             return (
                <div className="py-12">
                    <p className="text-text-secondary">正在等待麦克风权限...</p>
                </div>
            );
        }
        return (
            <>
                <div className="text-5xl font-mono tracking-widest text-text-primary mb-4">
                    {formatTime(elapsedTime)}
                </div>
                {renderVisualizerArea()}
                <p className="mt-4 text-text-secondary min-h-[4em] bg-base-100 p-3 rounded-lg border border-base-300">
                    {transcript || (recordingStatus === 'recording' ? '正在聆听... 请开始说话。' : '...')}
                </p>
            </>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <MicrophoneIcon className="w-6 h-6" />
                        录制语音笔记
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">畅所欲言。您的语音将被转录并分析。</p>
                </div>

                <div className="p-6 text-center">
                   {renderContent()}
                </div>

                <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-between items-center gap-4 border-t border-base-300">
                    <div className="w-1/3">
                        {isProcessing && <p className="text-sm text-text-secondary">{isAnalyzing ? '分析中...' : '处理中...'}</p>}
                    </div>
                    <div className="flex justify-center items-center gap-4 w-1/3">
                       {recordingStatus === 'recording' && (
                           <button onClick={pauseRecording} disabled={hasError} className="p-3 bg-base-100 rounded-full hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300">
                               <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"></path></svg>
                           </button>
                       )}
                       {recordingStatus === 'paused' && (
                           <button onClick={resumeRecording} disabled={hasError} className="p-3 bg-base-100 rounded-full hover:bg-base-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-base-300">
                               <svg className="w-6 h-6 text-text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8L4.018 2L4 14z"></path></svg>
                           </button>
                       )}
                       {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
                           <button onClick={stopRecording} disabled={hasError} className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                               <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5h10v10H5V5z"></path></svg>
                           </button>
                       )}
                    </div>
                    <div className="flex justify-end w-1/3">
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={!transcript.trim() || !audioBlob || isProcessing || hasError}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isAnalyzing ? '分析中...' : '保存中...'}
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5"/>
                                    保存并分析
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(20px) scale(0.98); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AddVoiceRecordModal;