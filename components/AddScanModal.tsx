
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Record, GeminiScanAnalysisResult, ActionItem } from '../types';
import { analyzeImageWithGemini } from '../services/geminiService';
import { CameraIcon } from './icons/CameraIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AddScanModalProps {
    onClose: () => void;
    onSave: (record: Record) => void;
}

type View = 'live' | 'preview' | 'analyzing' | 'result';

const AddScanModal: React.FC<AddScanModalProps> = ({ onClose, onSave }) => {
    const [view, setView] = useState<View>('live');
    const [imagesData, setImagesData] = useState<string[]>([]);
    const [analysisResult, setAnalysisResult] = useState<GeminiScanAnalysisResult | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const setupCamera = useCallback(async () => {
        try {
            setError(null);
            if (streamRef.current) cleanupCamera();
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            let message = "无法访问摄像头。请在浏览器设置中授予权限。";
            if (err instanceof DOMException) {
                if (err.name === "NotFoundError") message = "找不到摄像头设备。";
                if (err.name === "NotReadableError") message = "无法启动摄像头，它可能正在被另一个应用程序使用。";
            }
            setError(message);
        }
    }, [cleanupCamera]);

    useEffect(() => {
        if (view === 'live') {
            setupCamera();
        } else {
            cleanupCamera();
        }
        return () => {
            cleanupCamera();
        };
    }, [view, setupCamera, cleanupCamera]);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setImagesData(prev => [...prev, dataUrl]);
                setView('preview');
            }
        }
    }, []);

    const handleAddPage = useCallback(() => {
        setView('live');
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (imagesData.length === 0) return;
        setView('analyzing');
        setError(null);
        try {
            const base64DataArray = imagesData.map(dataUrl => dataUrl.split(',')[1]);
            const result = await analyzeImageWithGemini(base64DataArray, 'image/jpeg');
            setAnalysisResult(result);
            setEditedContent(result.ocrText);
            setView('result');
        } catch (err) {
            setError("AI分析失败，请重试。");
            setView('preview');
        }
    }, [imagesData]);

    const handleSave = useCallback(() => {
        if (imagesData.length === 0 || !analysisResult) return;
        const recordId = crypto.randomUUID();
        const newRecord: Record = {
            id: recordId,
            type: 'scan',
            content: editedContent,
            timestamp: new Date().toISOString(),
            tags: analysisResult.tags,
            actionItems: analysisResult.actionItems.map((item) => ({
                id: crypto.randomUUID(),
                ...item,
                status: 'todo',
                subtasks: [],
                recordId: recordId,
                priority: item.priority || 'medium',
            })),
            scanDetails: {
                imageUrl: imagesData[0], // Use first image as cover
            },
            fullText: analysisResult.ocrText,
        };
        onSave(newRecord);
    }, [imagesData, analysisResult, editedContent, onSave]);

    const isLoading = view === 'analyzing';

    const renderContent = () => {
        if (error) {
            return <div className="p-8 text-center text-red-500">{error}</div>;
        }
        switch (view) {
            case 'live':
                return (
                    <div className="relative aspect-video bg-slate-800">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain"></video>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <button onClick={handleCapture} className="w-16 h-16 bg-white rounded-full border-4 border-slate-400/50 ring-2 ring-white/50"></button>
                        </div>
                    </div>
                );
            case 'preview':
                return (
                    <div className="p-4 space-y-4 bg-base-100">
                        <div className="grid grid-cols-3 gap-2">
                          {imagesData.map((imgSrc, index) => (
                              <img key={index} src={imgSrc} alt={`Page ${index + 1}`} className="w-full rounded-md object-cover aspect-square" />
                          ))}
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleAddPage} className="px-6 py-2 font-medium text-text-primary rounded-lg bg-base-200 border border-base-300 hover:bg-base-300/50">添加页面</button>
                            <button onClick={handleAnalyze} className="px-6 py-2 font-medium text-white bg-tag-green-text rounded-lg hover:opacity-90">完成并分析</button>
                        </div>
                    </div>
                );
            case 'analyzing':
                return (
                    <div className="p-8 text-center space-y-4">
                        <svg className="animate-spin mx-auto h-10 w-10 text-tag-green-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-text-secondary">AI 正在识别和分析 {imagesData.length} 个页面...</p>
                    </div>
                );
            case 'result':
                 return (
                    <div className="p-6 space-y-4 bg-base-100">
                        <img src={imagesData[0]} alt="Scan preview" className="w-full rounded-lg max-h-40 object-contain" />
                        <textarea
                            value={editedContent}
                            onChange={e => setEditedContent(e.target.value)}
                            placeholder="AI 识别出的文本..."
                            className="w-full h-40 p-3 bg-base-200 border border-base-300 rounded-lg text-text-primary focus:outline-none focus:border-tag-green-text"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-slide-up border border-base-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <CameraIcon className="w-6 h-6" />
                        扫描文档
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>

                {renderContent()}

                {view === 'result' && (
                     <div className="bg-base-100/50 px-6 py-4 rounded-b-2xl flex justify-end items-center gap-4 border-t border-base-300">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-base-300/50">取消</button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-tag-green-text rounded-lg shadow-md hover:opacity-90 flex items-center gap-2"
                        >
                            <SparklesIcon className="w-5 h-5"/>
                            保存
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AddScanModal;